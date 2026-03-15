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
      const pkgJson = JSON.stringify(packages)
      await this.pyodide.runPythonAsync(
        `import micropip; await micropip.install(${pkgJson})`,
      )
    }
    await this.pyodide.runPythonAsync(appCode)
  }

  async handleRequest(request: Request): Promise<Response> {
    if (!this.pyodide) throw new Error('PythonRuntime not initialized')

    const app = this.pyodide.globals.get('app') as AsgiAppCallable
    const url = new URL(request.url)
    const bodyBytes = request.body
      ? new Uint8Array(await request.arrayBuffer())
      : new Uint8Array()

    const scope: Record<string, unknown> = {
      type: 'http',
      method: request.method.toUpperCase(),
      path: url.pathname,
      query_string: url.search.slice(1), // strip leading '?'
      headers: [...request.headers.entries()].map(([k, v]) => [k.toLowerCase(), v]),
      server: [url.hostname, Number(url.port) || 443],
    }

    const receiveEvent = { type: 'http.request', body: bodyBytes, more_body: false }
    const receive = async () => receiveEvent

    const events: AsgiSendEvent[] = []
    const send = async (event: AsgiSendEvent) => { events.push(event) }

    await app(scope, receive, send)

    const startEvent = events.find((e) => e.type === 'http.response.start') as
      | { type: 'http.response.start'; status: number; headers: [string, string][] }
      | undefined
    if (!startEvent) throw new Error('ASGI app did not send http.response.start')

    const bodyChunks = events
      .filter((e) => e.type === 'http.response.body')
      .map((e) => (e as { type: 'http.response.body'; body: Uint8Array }).body)
    const totalLen = bodyChunks.reduce((n, c) => n + c.length, 0)
    const combined = new Uint8Array(totalLen)
    let offset = 0
    for (const chunk of bodyChunks) {
      combined.set(chunk, offset)
      offset += chunk.length
    }

    const responseHeaders = new Headers()
    for (const [k, v] of startEvent.headers ?? []) {
      responseHeaders.set(k, v)
    }

    return new Response(combined, { status: startEvent.status, headers: responseHeaders })
  }

  get isReady(): boolean {
    return this.pyodide !== null
  }
}
