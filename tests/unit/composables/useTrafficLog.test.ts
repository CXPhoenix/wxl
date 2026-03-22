import { describe, it, expect, vi } from 'vitest'
import { useTrafficLog } from '../../../.vitepress/theme/composables/useTrafficLog'

describe('useTrafficLog', () => {
  it('records a GET request entry after dispatch', async () => {
    const { trafficLog, wrap } = useTrafficLog()
    const mockDispatch = vi.fn().mockResolvedValue(
      new Response('Hello', { status: 200, headers: { 'Content-Type': 'text/plain' } }),
    )
    const tracked = wrap(mockDispatch)

    await tracked(new Request('https://challenge-test.localhost/api'))

    expect(trafficLog.value).toHaveLength(1)
    const entry = trafficLog.value[0]
    expect(entry.method).toBe('GET')
    expect(entry.url).toBe('https://challenge-test.localhost/api')
    expect(entry.status).toBe(200)
    expect(entry.responseBody).toBe('Hello')
    expect(entry.duration).toBeGreaterThanOrEqual(0)
    expect(entry.id).toBe(1)
  })

  it('records request headers and body for POST request', async () => {
    const { trafficLog, wrap } = useTrafficLog()
    const mockDispatch = vi.fn().mockResolvedValue(new Response('ok', { status: 201 }))
    const tracked = wrap(mockDispatch)

    const req = new Request('https://challenge-test.localhost/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'username=admin&password=secret',
    })
    await tracked(req)

    const entry = trafficLog.value[0]
    expect(entry.method).toBe('POST')
    expect(entry.requestBody).toBe('username=admin&password=secret')
    expect(entry.requestHeaders.map(([k]) => k.toLowerCase())).toContain('content-type')
  })

  it('records response headers', async () => {
    const { trafficLog, wrap } = useTrafficLog()
    const mockDispatch = vi.fn().mockResolvedValue(
      new Response('body', { status: 200, headers: { 'X-Custom': 'value' } }),
    )
    const tracked = wrap(mockDispatch)

    await tracked(new Request('https://challenge-test.localhost/'))

    const entry = trafficLog.value[0]
    expect(entry.responseHeaders.map(([k]) => k.toLowerCase())).toContain('x-custom')
  })

  it('records multiple entries with incrementing ids', async () => {
    const { trafficLog, wrap } = useTrafficLog()
    const mockDispatch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))
    const tracked = wrap(mockDispatch)

    await tracked(new Request('https://challenge-test.localhost/a'))
    await tracked(new Request('https://challenge-test.localhost/b'))

    expect(trafficLog.value).toHaveLength(2)
    expect(trafficLog.value[0].id).toBe(1)
    expect(trafficLog.value[1].id).toBe(2)
  })

  it('clears all entries when clear() is called', async () => {
    const { trafficLog, wrap, clear } = useTrafficLog()
    const mockDispatch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))
    const tracked = wrap(mockDispatch)

    await tracked(new Request('https://challenge-test.localhost/'))
    expect(trafficLog.value).toHaveLength(1)

    clear()
    expect(trafficLog.value).toHaveLength(0)
  })

  it('returns the original response unchanged', async () => {
    const { wrap } = useTrafficLog()
    const mockDispatch = vi.fn().mockResolvedValue(
      new Response('data', { status: 404, headers: { 'X-Flag': 'abc' } }),
    )
    const tracked = wrap(mockDispatch)

    const result = await tracked(new Request('https://challenge-test.localhost/'))
    expect(result.status).toBe(404)
    const body = await result.text()
    expect(body).toBe('data')
    expect(result.headers.get('x-flag')).toBe('abc')
  })

  it('requestBody is null for GET requests', async () => {
    const { trafficLog, wrap } = useTrafficLog()
    const mockDispatch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))
    const tracked = wrap(mockDispatch)

    await tracked(new Request('https://challenge-test.localhost/'))
    expect(trafficLog.value[0].requestBody).toBeNull()
  })
})
