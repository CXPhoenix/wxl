export type LoadPyodideFn = (opts?: Record<string, unknown>) => Promise<PyodideInstance>

type AsgiSendEvent =
  | { type: 'http.response.start'; status: number; headers: [string, string][] }
  | { type: 'http.response.body'; body: Uint8Array; more_body: boolean }

type AsgiAppCallable = (
  scope: Record<string, unknown>,
  receive: () => Promise<{ type: string; body: Uint8Array; more_body: boolean }>,
  send: (event: AsgiSendEvent) => Promise<void>,
) => Promise<void>

interface PyodideInstance {
  runPythonAsync(code: string): Promise<unknown>
  loadPackage(packages: string | string[]): Promise<void>
  FS: { writeFile(path: string, data: Uint8Array | string): void }
  globals: { get(name: string): unknown }
}

/**
 * Manages a single Pyodide instance per challenge session.
 * Loads Pyodide exactly once; subsequent initialize() calls are no-ops.
 */
export class PythonRuntime {
  private pyodide: PyodideInstance | null = null
  private initPromise: Promise<void> | null = null
  private readonly loadPyodide: LoadPyodideFn

  constructor(loadPyodide: LoadPyodideFn) {
    this.loadPyodide = loadPyodide
  }

  async initialize(appCode: string, fsEntries: Record<string, Uint8Array> = {}, packages: string[] = []): Promise<void> {
    if (this.initPromise) return this.initPromise
    this.initPromise = this._init(appCode, fsEntries, packages)
    return this.initPromise
  }

  private async _init(appCode: string, fsEntries: Record<string, Uint8Array>, packages: string[]): Promise<void> {
    this.pyodide = await this.loadPyodide()
    for (const [path, data] of Object.entries(fsEntries)) {
      this.pyodide.FS.writeFile(path, data)
    }
    if (packages.length > 0) {
      await this.pyodide.loadPackage('micropip')
      const pkgJson = JSON.stringify(packages)
      await this.pyodide.runPythonAsync(
        `import micropip; await micropip.install(${pkgJson})`,
      )
    }
    await this.pyodide.runPythonAsync(appCode)
    // Inject ASGI bridge: handles JS→Python type conversion and serialises
    // the response as JSON (body base64-encoded) to avoid Pyodide proxy issues.
    await this.pyodide.runPythonAsync(`
import json as _json, base64 as _b64

async def _asgi_bridge(method, path, query_string, js_headers, body_bytes):
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method.upper(),
        "path": path,
        "raw_path": path.encode("utf-8"),
        "query_string": query_string.encode("utf-8") if query_string else b"",
        "root_path": "",
        "scheme": "https",
        "headers": [(k.encode("utf-8"), v.encode("utf-8")) for k, v in js_headers],
        "server": ("localhost", 443),
    }
    body = bytes(body_bytes) if body_bytes else b""
    _called = False
    async def receive():
        nonlocal _called
        if not _called:
            _called = True
            return {"type": "http.request", "body": body, "more_body": False}
        return {"type": "http.disconnect"}
    resp_status = 200
    resp_headers = []
    resp_body = b""
    async def send(event):
        nonlocal resp_status, resp_headers, resp_body
        t = event.get("type", "")
        if t == "http.response.start":
            resp_status = int(event["status"])
            resp_headers = [
                (hk.decode("utf-8", "replace"), hv.decode("utf-8", "replace"))
                for hk, hv in event.get("headers", [])
            ]
        elif t == "http.response.body":
            resp_body += event.get("body", b"")
    await app(scope, receive, send)
    return _json.dumps({
        "status": resp_status,
        "headers": resp_headers,
        "body": _b64.b64encode(resp_body).decode("ascii"),
    })
`)
  }

  async handleRequest(request: Request): Promise<Response> {
    if (!this.pyodide) throw new Error('PythonRuntime not initialized')

    const bridge = this.pyodide.globals.get('_asgi_bridge') as (
      method: string, path: string, qs: string,
      headers: [string, string][], body: Uint8Array,
    ) => Promise<string>

    const url = new URL(request.url)
    const bodyBytes = request.body
      ? new Uint8Array(await request.arrayBuffer())
      : new Uint8Array()
    const headers = [...request.headers.entries()].map(([k, v]) => [k.toLowerCase(), v] as [string, string])

    const raw = await bridge(request.method.toUpperCase(), url.pathname, url.search.slice(1), headers, bodyBytes)
    const result: { status: number; headers: [string, string][]; body: string } = JSON.parse(raw as unknown as string)

    const responseHeaders = new Headers()
    for (const [k, v] of result.headers) responseHeaders.set(k, v)

    const body = Uint8Array.from(atob(result.body), (c) => c.charCodeAt(0))
    return new Response(body, { status: result.status, headers: responseHeaders })
  }

  get isReady(): boolean {
    return this.pyodide !== null
  }
}
