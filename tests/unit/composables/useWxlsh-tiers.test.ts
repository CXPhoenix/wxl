import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import 'fake-indexeddb/auto'

// Mock the WASM parser and challenge persistence
vi.mock('../../../.vitepress/theme/composables/useChallengePersistence', () => ({
  useChallengePersistence: () => ({
    appendHistory: vi.fn(),
    loadHistory: vi.fn().mockResolvedValue([]),
  }),
}))

import { useWxlsh, type PyodidePublicAPI } from '../../../.vitepress/theme/composables/useWxlsh'

function makeWxlsh(commands: string[] = []) {
  const pyodide = ref<PyodidePublicAPI | null>(null)
  return useWxlsh({
    slug: 'test',
    dispatch: vi.fn().mockResolvedValue(new Response('ok')),
    pyodide,
    commands,
  })
}

describe('useWxlsh - five-tier dispatch', () => {
  // Tier 1: core shell commands (TypeScript)
  describe('Tier 1 - core shell', () => {
    it('help returns list of available commands', async () => {
      const wxlsh = makeWxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute('help')
      expect(result.output).toContain('Available commands')
      expect(result.output).toContain('ls')
      expect(result.output).toContain('cat')
    })

    it('pwd returns current working directory', async () => {
      const wxlsh = makeWxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute('pwd')
      expect(result.output).toBe('/home/hacker')
    })

    it('echo outputs its arguments', async () => {
      const wxlsh = makeWxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute('echo hello world')
      expect(result.output).toBe('hello world')
    })

    it('whoami returns default username', async () => {
      const wxlsh = makeWxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute('whoami')
      expect(result.output).toBe('hacker')
    })

    it('clear sets clear flag', async () => {
      const wxlsh = makeWxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute('clear')
      expect(result.clear).toBe(true)
    })

    it('date returns a date string', async () => {
      const wxlsh = makeWxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute('date')
      expect(result.output.length).toBeGreaterThan(0)
    })

    it('id returns user identity', async () => {
      const wxlsh = makeWxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute('id')
      expect(result.output).toContain('hacker')
    })

    it('which returns command location for known commands', async () => {
      const wxlsh = makeWxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute('which ls')
      expect(result.output).toContain('ls')
    })
  })

  // Tier 5: controlled by commands frontmatter
  describe('Tier 5 - controlled commands', () => {
    it('blocks Tier 5 command when not in allowed list', async () => {
      const wxlsh = makeWxlsh([]) // no commands enabled
      await wxlsh.init()
      const result = await wxlsh.execute('sqlmap -u http://test/')
      expect(result.output).toContain('not available')
      expect(result.error).toBe(true)
    })
  })

  // Pipe support
  describe('Pipe |', () => {
    it('chains echo into a second command via pipe', async () => {
      const wxlsh = makeWxlsh()
      await wxlsh.init()
      // echo produces output, which is piped as stdin (first arg) to the next command
      const result = await wxlsh.execute('echo hello | echo piped')
      // The second echo gets "hello" as first arg, then "piped"
      expect(result.output).toContain('hello')
    })

    it('single command without pipe works normally', async () => {
      const wxlsh = makeWxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute('whoami')
      expect(result.output).toBe('hacker')
    })
  })

  // Unknown commands
  describe('Unknown commands', () => {
    it('returns command not found for unknown commands', async () => {
      const wxlsh = makeWxlsh()
      await wxlsh.init()
      const result = await wxlsh.execute('nonexistent_cmd')
      expect(result.output).toContain('command not found')
      expect(result.error).toBe(true)
    })
  })
})
