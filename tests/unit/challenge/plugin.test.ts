import { describe, it, expect } from 'vitest'
import { processChallengeFrontmatter } from '../../../.vitepress/challenge/plugin'

const BASE_FRONTMATTER = {
  title: 'Test Challenge',
  flag_verifier: 'abc123hash',
  fs_key: 'a'.repeat(64),
  backend: 'flask' as const,
  app: './app.py',
  fs: { '/flag.txt': 'FLAG{test}' },
}

const APP_CODE = 'from flask import Flask\napp = Flask(__name__)'

describe('processChallengeFrontmatter - source_visible', () => {
  it('[RED] black-box: app source must NOT appear as plaintext in output', async () => {
    const result = await processChallengeFrontmatter(
      { ...BASE_FRONTMATTER, source_visible: false },
      { 'app.py': APP_CODE },
    )
    expect(result.appSource).toBeUndefined()
    expect(JSON.stringify(result)).not.toContain(APP_CODE)
  })

  it('[RED] white-box: app source MUST appear as plaintext in output', async () => {
    const result = await processChallengeFrontmatter(
      { ...BASE_FRONTMATTER, source_visible: true },
      { 'app.py': APP_CODE },
    )
    expect(result.appSource).toBe(APP_CODE)
  })

  it('[RED] default (no source_visible): behaves as black-box', async () => {
    const result = await processChallengeFrontmatter(
      BASE_FRONTMATTER,
      { 'app.py': APP_CODE },
    )
    expect(result.appSource).toBeUndefined()
    expect(JSON.stringify(result)).not.toContain(APP_CODE)
  })
})

describe('processChallengeFrontmatter - FS encryption', () => {
  it('[RED] fs entries must be encrypted blobs, not plaintext', async () => {
    const result = await processChallengeFrontmatter(
      BASE_FRONTMATTER,
      { 'app.py': APP_CODE },
    )
    expect(result.encryptedFs).toBeDefined()
    expect(typeof result.encryptedFs).toBe('object')
    // The value for /flag.txt should NOT be the original string
    const flagEntry = result.encryptedFs['/flag.txt']
    expect(flagEntry).toBeDefined()
    expect(flagEntry).not.toBe('FLAG{test}')
    // Should be a base64-encoded blob (iv + ciphertext)
    expect(typeof flagEntry).toBe('string')
    expect(flagEntry.length).toBeGreaterThan(20)
  })

  it('[RED] fs encrypted even when source_visible is true', async () => {
    const result = await processChallengeFrontmatter(
      { ...BASE_FRONTMATTER, source_visible: true },
      { 'app.py': APP_CODE },
    )
    expect(result.encryptedFs['/flag.txt']).not.toBe('FLAG{test}')
  })
})
