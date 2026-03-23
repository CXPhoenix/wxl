import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock useChallengePersistence ─────────────────────────────────────────────
let savedSessions: Record<string, any> = {}
const mockSaveAttackSession = vi.fn(async (session: any) => {
  savedSessions[session.challengeSlug] = structuredClone(session)
})
const mockLoadAttackSession = vi.fn(async (slug: string) => {
  return savedSessions[slug] ?? null
})

vi.mock('../../../.vitepress/theme/composables/useChallengePersistence', () => ({
  useChallengePersistence: () => ({
    saveAttackSession: mockSaveAttackSession,
    loadAttackSession: mockLoadAttackSession,
  }),
}))

beforeEach(() => {
  savedSessions = {}
  mockSaveAttackSession.mockClear()
  mockLoadAttackSession.mockClear()
  vi.restoreAllMocks()
})

describe('useAttackSession', () => {
  it('creates a new session with challenge_start event on first visit', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('sqli-demo', 'SQL Injection Demo')
    await session.init()

    expect(mockLoadAttackSession).toHaveBeenCalledWith('sqli-demo')
    expect(mockSaveAttackSession).toHaveBeenCalled()
    const saved = mockSaveAttackSession.mock.calls[0][0]
    expect(saved.challengeSlug).toBe('sqli-demo')
    expect(saved.challengeTitle).toBe('SQL Injection Demo')
    expect(saved.solvedAt).toBeNull()
    expect(saved.events).toHaveLength(1)
    expect(saved.events[0].type).toBe('challenge_start')
  })

  it('resumes existing unsolved session without adding a new challenge_start event', async () => {
    const existingSession = {
      challengeSlug: 'xss-demo',
      challengeTitle: 'XSS Demo',
      startedAt: 1000,
      solvedAt: null,
      events: [{ type: 'challenge_start', timestamp: 1000 }],
    }
    savedSessions['xss-demo'] = existingSession

    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('xss-demo', 'XSS Demo')
    await session.init()

    // Should NOT have saved a new session (just resumed)
    expect(mockSaveAttackSession).not.toHaveBeenCalled()
    // The internal session should be the existing one
    const exported = session.getSession()
    expect(exported?.startedAt).toBe(1000)
    expect(exported?.events).toHaveLength(1)
  })

  it('addHttpEvent appends http_request event with source attribution', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('sqli-demo', 'SQL Injection Demo')
    await session.init()

    const entry = {
      id: 1, timestamp: Date.now(), method: 'GET', url: 'https://challenge-sqli.localhost/',
      requestHeaders: [['Host', 'challenge-sqli.localhost']] as [string, string][],
      requestBody: null, status: 200,
      responseHeaders: [['Content-Type', 'text/html']] as [string, string][],
      responseBody: '<html></html>', duration: 42,
    }
    await session.addHttpEvent(entry, 'browser')

    const s = session.getSession()!
    expect(s.events).toHaveLength(2) // challenge_start + http_request
    const httpEvent = s.events[1]
    expect(httpEvent.type).toBe('http_request')
    expect((httpEvent as any).source).toBe('browser')
    expect((httpEvent as any).method).toBe('GET')
    expect((httpEvent as any).status).toBe(200)

    // Should have been persisted
    expect(mockSaveAttackSession).toHaveBeenCalledTimes(2) // init + addHttpEvent
  })

  it('addHttpEvent with repeater source', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test')
    await session.init()

    const entry = {
      id: 2, timestamp: Date.now(), method: 'POST', url: 'https://challenge-test.localhost/login',
      requestHeaders: [] as [string, string][],
      requestBody: 'user=admin', status: 302,
      responseHeaders: [] as [string, string][],
      responseBody: '', duration: 10,
    }
    await session.addHttpEvent(entry, 'repeater')

    const httpEvent = session.getSession()!.events[1]
    expect((httpEvent as any).source).toBe('repeater')
    expect((httpEvent as any).requestBody).toBe('user=admin')
  })

  it('addFlagAttempt records incorrect flag attempt without solving', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test')
    await session.init()

    await session.addFlagAttempt('CTF{wrong}', false)

    const s = session.getSession()!
    expect(s.events).toHaveLength(2) // challenge_start + flag_attempt
    const flagEvent = s.events[1]
    expect(flagEvent.type).toBe('flag_attempt')
    expect((flagEvent as any).submitted).toBe('CTF{wrong}')
    expect((flagEvent as any).correct).toBe(false)
    expect(s.solvedAt).toBeNull()
  })

  it('addFlagAttempt with correct=true appends challenge_solved and sets solvedAt', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('test', 'Test')
    await session.init()

    await session.addFlagAttempt('CTF{correct}', true)

    const s = session.getSession()!
    expect(s.events).toHaveLength(3) // challenge_start + flag_attempt + challenge_solved
    expect(s.events[1].type).toBe('flag_attempt')
    expect((s.events[1] as any).correct).toBe(true)
    expect(s.events[2].type).toBe('challenge_solved')
    expect(s.solvedAt).toBeTypeOf('number')
    expect(s.solvedAt).toBeGreaterThan(0)
  })

  it('exportSession triggers browser download with correct filename', async () => {
    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('sqli-demo', 'SQL Injection Demo')
    await session.init()

    // Mock DOM elements for Blob download
    const clickSpy = vi.fn()
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as any)
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    session.exportSession()

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(createObjectURLSpy).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test')

    // Verify filename pattern
    const anchor = createElementSpy.mock.results[0].value
    expect(anchor.download).toMatch(/^attack-session-sqli-demo-\d{8}-\d{6}\.json$/)

    createElementSpy.mockRestore()
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
  })

  it('creates a new session overwriting solved session on re-visit', async () => {
    const solvedSession = {
      challengeSlug: 'csrf-demo',
      challengeTitle: 'CSRF Demo',
      startedAt: 1000,
      solvedAt: 2000,
      events: [
        { type: 'challenge_start', timestamp: 1000 },
        { type: 'challenge_solved', timestamp: 2000 },
      ],
    }
    savedSessions['csrf-demo'] = solvedSession

    const { useAttackSession } = await import('../../../.vitepress/theme/composables/useAttackSession')
    const session = useAttackSession('csrf-demo', 'CSRF Demo')
    await session.init()

    // Should have created a new session overwriting the solved one
    expect(mockSaveAttackSession).toHaveBeenCalled()
    const saved = mockSaveAttackSession.mock.calls[0][0]
    expect(saved.solvedAt).toBeNull()
    expect(saved.events).toHaveLength(1)
    expect(saved.events[0].type).toBe('challenge_start')
    expect(saved.startedAt).not.toBe(1000) // New startedAt
  })
})
