export type LoadPyodideFn = (opts?: Record<string, unknown>) => Promise<PyodideInstance>

/**
 * Python code that monkey-patches requests.adapters.HTTPAdapter.send()
 * to route HTTP through the Pyodide ↔ JS dispatch bridge.
 *
 * How it works:
 * 1. Replaces HTTPAdapter.send() with a custom implementation
 * 2. Extracts method/url/headers/body from the PreparedRequest
 * 3. Calls pyodide.http.open_url (synchronous XMLHttpRequest under the hood)
 *    or uses the JS bridge function set on globals
 * 4. Wraps the JS response back into a urllib3.HTTPResponse
 */
const REQUESTS_MONKEY_PATCH = `
import requests
from requests.adapters import HTTPAdapter
from urllib3 import HTTPResponse as _Urllib3Response
from io import BytesIO as _BytesIO

_original_send = HTTPAdapter.send

def _patched_send(self, request, stream=False, timeout=None, verify=True, cert=None, proxies=None):
    from pyodide.http import open_url
    import json as _json

    method = request.method or "GET"
    url = request.url
    headers = dict(request.headers or {})
    body = request.body

    # Use XMLHttpRequest via pyodide.http for synchronous dispatch
    # This goes through the Service Worker which routes to the challenge runtime
    try:
        from js import XMLHttpRequest
        xhr = XMLHttpRequest.new()
        xhr.open(method, url, False)  # synchronous
        for k, v in headers.items():
            try:
                xhr.setRequestHeader(k, v)
            except Exception:
                pass  # skip forbidden headers
        if body:
            if isinstance(body, bytes):
                body = body.decode("utf-8", errors="replace")
            xhr.send(body)
        else:
            xhr.send()

        resp_body = (xhr.response or "").encode("utf-8")
        resp_headers = xhr.getAllResponseHeaders() or ""
        status = xhr.status

        # Parse response headers
        header_dict = {}
        for line in resp_headers.strip().split("\\r\\n"):
            if ":" in line:
                k, v = line.split(":", 1)
                header_dict[k.strip().lower()] = v.strip()

        urllib3_resp = _Urllib3Response(
            body=_BytesIO(resp_body),
            headers=header_dict,
            status=status,
            preload_content=False,
        )
        urllib3_resp._body = resp_body

        from requests.models import Response
        resp = Response()
        resp.status_code = status
        resp.headers.update(header_dict)
        resp._content = resp_body
        resp.encoding = "utf-8"
        resp.url = url
        resp.request = request
        return resp
    except Exception as e:
        raise ConnectionError(f"WXL dispatch bridge error: {e}") from e

HTTPAdapter.send = _patched_send
`

/** Pyodide built-in packages that must be loaded via loadPackage(), not micropip */
const PYODIDE_NATIVE_PKGS = new Set(['sqlite3', 'ssl', 'lzma', 'numpy', 'pandas'])

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
  globals: { get(name: string): unknown; set(name: string, value: unknown): void }
}

/**
 * Manages a single Pyodide instance per challenge session.
 * Loads Pyodide exactly once; subsequent initialize() calls are no-ops.
 */
export class PythonRuntime {
  private pyodide: PyodideInstance | null = null
  private initPromise: Promise<void> | null = null
  private readonly loadPyodide: LoadPyodideFn

  /** Returns the Pyodide instance after initialization, or null if not ready. */
  getPyodide(): PyodideInstance | null { return this.pyodide }

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
    const nativePkgs = packages.filter((p) => PYODIDE_NATIVE_PKGS.has(p))
    const pipPkgs = packages.filter((p) => !PYODIDE_NATIVE_PKGS.has(p))

    if (nativePkgs.length > 0) {
      await this.pyodide.loadPackage(nativePkgs)
    }
    if (pipPkgs.length > 0) {
      await this.pyodide.loadPackage('micropip')
      const pkgJson = JSON.stringify(pipPkgs)
      await this.pyodide.runPythonAsync(
        `import micropip; await micropip.install(${pkgJson})`,
      )
    }
    await this.pyodide.runPythonAsync(appCode)

    // Install requests and monkey-patch HTTPAdapter.send to route through JS dispatch bridge
    await this._installAndPatchRequests()

    // Inject ASGI/WSGI bridge: auto-detects Flask (WSGI) vs FastAPI (ASGI) and
    // serialises the response as JSON (body base64-encoded) to avoid Pyodide proxy issues.
    await this.pyodide.runPythonAsync(`
import json as _json, base64 as _b64, inspect as _inspect, io as _io

def _is_wsgi(application):
    """True if app looks like a 2-arg WSGI callable (not a coroutine function)."""
    if _inspect.iscoroutinefunction(application):
        return False
    try:
        params = [
            p for p in _inspect.signature(application).parameters.values()
            if p.default is _inspect.Parameter.empty
        ]
        return len(params) == 2
    except (ValueError, TypeError):
        return False

async def _asgi_bridge(method, path, query_string, js_headers, body_bytes):
    body = bytes(body_bytes) if body_bytes else b""
    headers_pairs = js_headers.to_py() if js_headers else []

    if _is_wsgi(app):
        # ── WSGI path (Flask) ────────────────────────────────────────────────
        environ = {
            "REQUEST_METHOD": method.upper(),
            "SCRIPT_NAME": "",
            "PATH_INFO": path,
            "QUERY_STRING": query_string or "",
            "SERVER_NAME": "localhost",
            "SERVER_PORT": "443",
            "SERVER_PROTOCOL": "HTTP/1.1",
            "wsgi.version": (1, 0),
            "wsgi.url_scheme": "https",
            "wsgi.input": _io.BytesIO(body),
            "wsgi.errors": _io.StringIO(),
            "wsgi.multithread": False,
            "wsgi.multiprocess": False,
            "wsgi.run_once": False,
        }
        for k, v in headers_pairs:
            key = k.upper().replace("-", "_")
            if key == "CONTENT_TYPE":
                environ["CONTENT_TYPE"] = v
            elif key == "CONTENT_LENGTH":
                environ["CONTENT_LENGTH"] = v
            else:
                environ["HTTP_" + key] = v
        # Always override CONTENT_LENGTH with actual body size so Flask/Werkzeug
        # can read the body even when the caller omits the Content-Length header.
        environ["CONTENT_LENGTH"] = str(len(body))
        _w_status = [200]
        _w_headers = [[]]
        def _start_response(status, response_headers, exc_info=None):
            _w_status[0] = int(status.split(" ", 1)[0])
            _w_headers[0] = [[k, v] for k, v in response_headers]
        wsgi_result = app(environ, _start_response)
        wsgi_body = b"".join(wsgi_result)
        return _json.dumps({
            "status": _w_status[0],
            "headers": _w_headers[0],
            "body": _b64.b64encode(wsgi_body).decode("ascii"),
        })
    else:
        # ── ASGI path (FastAPI / async Flask) ────────────────────────────────
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
            "headers": [(k.encode("utf-8"), v.encode("utf-8")) for k, v in headers_pairs],
            "server": ("localhost", 443),
        }
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

  /**
   * Install the real `requests` library via micropip and monkey-patch
   * HTTPAdapter.send() to route all HTTP through the JS dispatch bridge.
   */
  private async _installAndPatchRequests(): Promise<void> {
    if (!this.pyodide) return
    // Ensure micropip is available
    await this.pyodide.loadPackage('micropip')
    await this.pyodide.runPythonAsync(
      `import micropip; await micropip.install('requests')`,
    )
    // Monkey-patch the transport layer so requests uses the JS bridge
    await this.pyodide.runPythonAsync(REQUESTS_MONKEY_PATCH)
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

/**
 * Install requests and apply monkey-patch on any Pyodide instance.
 * Used by ChallengeLayout to patch the standalone tool-layer Pyodide
 * for non-Python backends (e.g., PHP).
 */
export async function installRequestsPatch(pyodide: PyodideInstance): Promise<void> {
  await pyodide.loadPackage('micropip')
  await pyodide.runPythonAsync(
    `import micropip; await micropip.install('requests')`,
  )
  await pyodide.runPythonAsync(REQUESTS_MONKEY_PATCH)
}
