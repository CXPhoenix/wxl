import { describe, it, expect, vi } from 'vitest'
import { PythonRuntime } from '../../../.vitepress/theme/composables/usePythonRuntime'

const APP_CODE = 'app = lambda scope, receive, send: None'

function makeMockPyodide(micropipInstall?: ReturnType<typeof vi.fn>) {
  const install = micropipInstall ?? vi.fn().mockResolvedValue(undefined)
  const runPythonAsync = vi.fn().mockImplementation(async (code: string) => {
    // simulate micropip being importable via runPythonAsync
    if (code.startsWith('import micropip')) return install
    return undefined
  })
  const pyodide = {
    runPythonAsync,
    FS: { writeFile: vi.fn() },
    globals: { get: vi.fn().mockReturnValue(vi.fn()) },
  }
  const loadPyodide = vi.fn().mockResolvedValue(pyodide)
  return { loadPyodide, pyodide, runPythonAsync, install }
}

describe('PythonRuntime - micropip packages', () => {
  it('[RED] installs packages via micropip before executing app_code', async () => {
    const { loadPyodide, runPythonAsync } = makeMockPyodide()
    const runtime = new PythonRuntime(loadPyodide)

    await runtime.initialize(APP_CODE, {}, ['flask', 'requests'])

    // micropip.install() should be called before app_code
    const calls = runPythonAsync.mock.calls.map((c: string[]) => c[0] as string)
    const micropipCallIdx = calls.findIndex((c) => c.includes('micropip'))
    const appCodeCallIdx = calls.findIndex((c) => c === APP_CODE)
    expect(micropipCallIdx).toBeGreaterThanOrEqual(0)
    expect(appCodeCallIdx).toBeGreaterThan(micropipCallIdx)
    expect(calls[micropipCallIdx]).toContain('flask')
    expect(calls[micropipCallIdx]).toContain('requests')
  })

  it('[RED] skips micropip when packages is empty', async () => {
    const { loadPyodide, runPythonAsync } = makeMockPyodide()
    const runtime = new PythonRuntime(loadPyodide)

    await runtime.initialize(APP_CODE, {}, [])

    const calls = runPythonAsync.mock.calls.map((c: string[]) => c[0] as string)
    const hasMicropip = calls.some((c) => c.includes('micropip'))
    expect(hasMicropip).toBe(false)
  })

  it('[RED] skips micropip when packages is not provided', async () => {
    const { loadPyodide, runPythonAsync } = makeMockPyodide()
    const runtime = new PythonRuntime(loadPyodide)

    await runtime.initialize(APP_CODE)

    const calls = runPythonAsync.mock.calls.map((c: string[]) => c[0] as string)
    const hasMicropip = calls.some((c) => c.includes('micropip'))
    expect(hasMicropip).toBe(false)
  })

  it('[RED] rejects initialize() when micropip install fails', async () => {
    const { loadPyodide, runPythonAsync } = makeMockPyodide()
    runPythonAsync.mockImplementation(async (code: string) => {
      if (code.includes('micropip')) throw new Error('PackageNotFoundError: nonexistent-pkg')
      return undefined
    })
    const runtime = new PythonRuntime(loadPyodide)

    await expect(runtime.initialize(APP_CODE, {}, ['nonexistent-pkg'])).rejects.toThrow(/nonexistent-pkg/)
  })
})
