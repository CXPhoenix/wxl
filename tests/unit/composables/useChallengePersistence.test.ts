import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock idb ─────────────────────────────────────────────────────────────────
// We use an in-memory store to simulate IndexedDB without a real browser IDB.
let codeScripts: Record<string, any> = {}
let terminalHistory: Array<{ id: number; command: string; timestamp: number }> = []
let historyCounter = 0

vi.mock('idb', () => ({
  openDB: vi.fn(async (_name: string, _version: number, { upgrade }: any) => {
    // Call upgrade with mock db to simulate store creation
    upgrade?.({
      objectStoreNames: { contains: () => false },
      createObjectStore: vi.fn(),
    })
    return {
      put(store: string, value: any) {
        if (store === 'code-scripts') codeScripts[value.id] = value
        if (store === 'terminal-history') {
          const id = ++historyCounter
          terminalHistory.push({ ...value, id })
          return id
        }
        return value.id
      },
      get(store: string, key: string) {
        if (store === 'code-scripts') return codeScripts[key] ?? null
        return null
      },
      getAll(store: string) {
        if (store === 'code-scripts') return Object.values(codeScripts)
        if (store === 'terminal-history') return [...terminalHistory]
        return []
      },
      delete(store: string, key: string) {
        if (store === 'code-scripts') delete codeScripts[key]
      },
    }
  }),
}))

beforeEach(() => {
  codeScripts = {}
  terminalHistory = []
  historyCounter = 0
  vi.resetModules()
})

describe('useChallengePersistence', () => {
  it('opens challenge-tools DB on first use', async () => {
    const { openDB } = await import('idb')
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { listScripts } = useChallengePersistence()
    await listScripts()  // triggers lazy DB open
    expect(openDB).toHaveBeenCalledWith('challenge-tools', 1, expect.any(Object))
  })

  it('saveScript stores script and returns an id', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { saveScript } = useChallengePersistence()
    const id = await saveScript('my-exploit', "print('hello')")
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
    expect(codeScripts[id]).toBeDefined()
    expect(codeScripts[id].name).toBe('my-exploit')
    expect(codeScripts[id].content).toBe("print('hello')")
  })

  it('listScripts returns scripts sorted by updatedAt descending', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { saveScript, listScripts } = useChallengePersistence()

    const id1 = await saveScript('first', 'code1')
    // Wait a tick to ensure different timestamps
    await new Promise(r => setTimeout(r, 2))
    const id2 = await saveScript('second', 'code2')

    const scripts = await listScripts()
    expect(scripts).toHaveLength(2)
    // More recently updated should be first
    expect(scripts[0].id).toBe(id2)
    expect(scripts[1].id).toBe(id1)
  })

  it('loadScript returns content by id', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { saveScript, loadScript } = useChallengePersistence()

    const id = await saveScript('test', 'content123')
    const content = await loadScript(id)
    expect(content).toBe('content123')
  })

  it('loadScript returns null for unknown id', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { loadScript } = useChallengePersistence()
    const content = await loadScript('nonexistent-uuid')
    expect(content).toBeNull()
  })

  it('deleteScript removes the script', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { saveScript, deleteScript, listScripts } = useChallengePersistence()

    const id = await saveScript('to-delete', 'bye')
    await deleteScript(id)
    const scripts = await listScripts()
    expect(scripts.find(s => s.id === id)).toBeUndefined()
  })

  it('appendHistory stores commands in order', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { appendHistory, loadHistory } = useChallengePersistence()

    await appendHistory('curl /a')
    await appendHistory('curl /b')
    await appendHistory('curl /c')

    const history = await loadHistory()
    expect(history).toEqual(['curl /a', 'curl /b', 'curl /c'])
  })

  it('appendHistory deduplicates consecutive identical commands', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { appendHistory, loadHistory } = useChallengePersistence()

    await appendHistory('curl /a')
    await appendHistory('curl /a')  // duplicate
    await appendHistory('curl /b')
    await appendHistory('curl /b')  // duplicate

    const history = await loadHistory()
    expect(history).toEqual(['curl /a', 'curl /b'])
  })

  it('loadHistory respects limit', async () => {
    const { useChallengePersistence } = await import('../../../.vitepress/theme/composables/useChallengePersistence')
    const { appendHistory, loadHistory } = useChallengePersistence()

    for (let i = 0; i < 10; i++) {
      await appendHistory(`cmd${i}`)
    }

    const history = await loadHistory(3)
    expect(history).toHaveLength(3)
    // Should be the last 3
    expect(history).toEqual(['cmd7', 'cmd8', 'cmd9'])
  })
})
