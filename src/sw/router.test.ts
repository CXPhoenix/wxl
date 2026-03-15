import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, type BackendDispatcher } from './router'

// ─── 5.1 SW intercepts challenge-*.localhost (HTTPS) ────────────────────────

describe('SW intercepts challenge-*.localhost (HTTPS)', () => {
  it('intercepts https://challenge-test.localhost/', () => {
    const router = createRouter()
    expect(router.shouldIntercept(new URL('https://challenge-test.localhost/'))).toBe(true)
  })

  it('intercepts https://challenge-sqli-basic.localhost/api/users', () => {
    const router = createRouter()
    expect(router.shouldIntercept(new URL('https://challenge-sqli-basic.localhost/api/users'))).toBe(true)
  })

  it('does NOT intercept https://vitepress.dev/', () => {
    const router = createRouter()
    expect(router.shouldIntercept(new URL('https://vitepress.dev/'))).toBe(false)
  })

  it('does NOT intercept https://localhost:5173/', () => {
    const router = createRouter()
    expect(router.shouldIntercept(new URL('https://localhost:5173/'))).toBe(false)
  })
})

// ─── 5.3 REGISTER / UNREGISTER challenge ────────────────────────────────────

describe('challenge registration', () => {
  it('routes to registered backend after REGISTER_CHALLENGE', async () => {
    const pythonDispatch = vi.fn().mockResolvedValue(new Response('ok'))
    const router = createRouter({ python: pythonDispatch })

    router.handleMessage({ type: 'REGISTER_CHALLENGE', slug: 'sqli', backend: 'flask' })

    const req = new Request('https://challenge-sqli.localhost/api')
    const res = await router.dispatch(req)

    expect(pythonDispatch).toHaveBeenCalledOnce()
  })

  it('returns 503 after UNREGISTER_CHALLENGE', async () => {
    const pythonDispatch = vi.fn().mockResolvedValue(new Response('ok'))
    const router = createRouter({ python: pythonDispatch })

    router.handleMessage({ type: 'REGISTER_CHALLENGE', slug: 'sqli', backend: 'flask' })
    router.handleMessage({ type: 'UNREGISTER_CHALLENGE', slug: 'sqli' })

    const req = new Request('https://challenge-sqli.localhost/api')
    const res = await router.dispatch(req)

    expect(res.status).toBe(503)
    expect(pythonDispatch).not.toHaveBeenCalled()
  })
})

// ─── 5.5 dispatch to correct runtime ────────────────────────────────────────

describe('runtime dispatch', () => {
  it('dispatches flask backend to python runtime', async () => {
    const pythonDispatch = vi.fn().mockResolvedValue(new Response('python ok'))
    const phpDispatch = vi.fn().mockResolvedValue(new Response('php ok'))
    const router = createRouter({ python: pythonDispatch, php: phpDispatch })

    router.handleMessage({ type: 'REGISTER_CHALLENGE', slug: 'flask-c', backend: 'flask' })
    await router.dispatch(new Request('https://challenge-flask-c.localhost/'))

    expect(pythonDispatch).toHaveBeenCalledOnce()
    expect(phpDispatch).not.toHaveBeenCalled()
  })

  it('dispatches php backend to php runtime', async () => {
    const pythonDispatch = vi.fn().mockResolvedValue(new Response('python ok'))
    const phpDispatch = vi.fn().mockResolvedValue(new Response('php ok'))
    const router = createRouter({ python: pythonDispatch, php: phpDispatch })

    router.handleMessage({ type: 'REGISTER_CHALLENGE', slug: 'php-c', backend: 'php' })
    await router.dispatch(new Request('https://challenge-php-c.localhost/'))

    expect(phpDispatch).toHaveBeenCalledOnce()
    expect(pythonDispatch).not.toHaveBeenCalled()
  })

  it('returns 501 for unknown backend', async () => {
    const router = createRouter()
    router.handleMessage({ type: 'REGISTER_CHALLENGE', slug: 'unknown-c', backend: 'unknown' as any })
    const res = await router.dispatch(new Request('https://challenge-unknown-c.localhost/'))
    expect(res.status).toBe(501)
  })
})

// ─── 5.7 error handling ──────────────────────────────────────────────────────

describe('runtime error handling', () => {
  it('returns 500 with error JSON when runtime throws', async () => {
    const brokenDispatch = vi.fn().mockRejectedValue(new Error('runtime exploded'))
    const router = createRouter({ python: brokenDispatch })

    router.handleMessage({ type: 'REGISTER_CHALLENGE', slug: 'broken', backend: 'flask' })
    const res = await router.dispatch(new Request('https://challenge-broken.localhost/'))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('in production mode, 500 body does not contain stack trace', async () => {
    const brokenDispatch = vi.fn().mockRejectedValue(new Error('oops'))
    const router = createRouter({ python: brokenDispatch }, { production: true })

    router.handleMessage({ type: 'REGISTER_CHALLENGE', slug: 'prod-c', backend: 'flask' })
    const res = await router.dispatch(new Request('https://challenge-prod-c.localhost/'))
    const body = await res.json()

    expect(body.stack).toBeUndefined()
    expect(body.error).toBe('Internal Server Error')
  })
})
