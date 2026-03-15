import { describe, it, expect } from 'vitest'
import { processChallengeFrontmatter } from './plugin'

const BASE = {
  title: 'T',
  flag_verifier: 'h',
  fs_key: 'deadbeef'.repeat(8), // 64 chars
  backend: 'flask' as const,
  app: 'app.py',
  fs: { '/flag.txt': 'FLAG{secret}', '/db': 'data' },
}

describe('2.7 [RED] fs_key obfuscation', () => {
  it('full fs_key hex must not appear as a contiguous string in serialised output', async () => {
    const result = await processChallengeFrontmatter(BASE, { 'app.py': 'code' })
    const serialised = JSON.stringify(result)
    expect(serialised).not.toContain(BASE.fs_key)
  })

  it('key is split into exactly 3 parts that reconstruct the original', async () => {
    const result = await processChallengeFrontmatter(BASE, { 'app.py': 'code' })
    expect(result.fsKeyParts).toHaveLength(3)
    expect(result.fsKeyParts.join('')).toBe(BASE.fs_key)
  })
})

describe('2.9 [RED] missing required field throws at process time', () => {
  it('throws when flag_verifier is absent', async () => {
    const { flag_verifier: _, ...rest } = BASE
    await expect(processChallengeFrontmatter(rest as any, {})).rejects.toThrow(/flag_verifier/)
  })

  it('throws when fs_key is absent', async () => {
    const { fs_key: _, ...rest } = BASE
    await expect(processChallengeFrontmatter(rest as any, {})).rejects.toThrow(/fs_key/)
  })
})
