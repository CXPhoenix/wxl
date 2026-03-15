import { describe, it, expect, vi } from 'vitest'
import { PythonRuntime } from './usePythonRuntime'

const APP_CODE = 'app = lambda scope, receive, send: None'

function makeMockFlaskPyodide(status: number, body: string, headers: [string, string][] = []) {
  const pyodide = {
    runPythonAsync: vi.fn().mockImplementation(async (code: string) => {
      if (code === APP_CODE) return undefined
    }),
    FS: { writeFile: vi.fn() },
    globals: {
      get: vi.fn().mockImplementation((name: string) => {
        if (name === 'app') {
          return async (_scope: unknown, _receive: unknown, send: (event: unknown) => Promise<void>) => {
            await send({ type: 'http.response.start', status, headers })
            await send({ type: 'http.response.body', body: new TextEncoder().encode(body), more_body: false })
          }
        }
      }),
    },
  }
  const loadPyodide = vi.fn().mockResolvedValue(pyodide)
  return { loadPyodide }
}

describe('PythonRuntime.handleRequest()', () => {
  it('returns correct status and body from Flask app for GET request', async () => {
    const { loadPyodide } = makeMockFlaskPyodide(200, 'Hello, World!')
    const runtime = new PythonRuntime(loadPyodide)

    await runtime.initialize(APP_CODE)

    const request = new Request('https://challenge-test.localhost/hello', { method: 'GET' })
    const response = await runtime.handleRequest(request)

    expect(response.status).toBe(200)
    const text = await response.text()
    expect(text).toBe('Hello, World!')
  })

  it('passes correct ASGI scope for GET /users?id=1', async () => {
    const scopeCapture: unknown[] = []
    const pyodide = {
      runPythonAsync: vi.fn(),
      FS: { writeFile: vi.fn() },
      globals: {
        get: vi.fn().mockImplementation((name: string) => {
          if (name === 'app') {
            return async (scope: unknown, _receive: unknown, send: (event: unknown) => Promise<void>) => {
              scopeCapture.push(scope)
              await send({ type: 'http.response.start', status: 200, headers: [] })
              await send({ type: 'http.response.body', body: new Uint8Array(), more_body: false })
            }
          }
        }),
      },
    }
    const loadPyodide = vi.fn().mockResolvedValue(pyodide)
    const runtime = new PythonRuntime(loadPyodide)
    await runtime.initialize(APP_CODE)

    const request = new Request('https://challenge-test.localhost/users?id=1')
    await runtime.handleRequest(request)

    expect(scopeCapture).toHaveLength(1)
    const scope = scopeCapture[0] as Record<string, unknown>
    expect(scope['type']).toBe('http')
    expect(scope['method']).toBe('GET')
    expect(scope['path']).toBe('/users')
    expect(scope['query_string']).toBe('id=1')
  })
})
