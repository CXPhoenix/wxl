import { describe, it, expect } from 'vitest'
import { validateChallengeConfig, LEGACY_FIELDS } from '../../../.vitepress/challenge/config'

describe('ChallengeConfig validation', () => {
  const minimal = {
    title: 'SQL Injection Basic',
    backend: 'flask' as const,
    app: './app.py',
    fs: { '/flag.txt': './flag.txt' },
  }

  it('accepts a valid config with all required fields', () => {
    expect(() => validateChallengeConfig(minimal)).not.toThrow()
  })

  it('throws when title is missing', () => {
    const { title: _, ...rest } = minimal
    expect(() => validateChallengeConfig(rest as any)).toThrow(/title/)
  })

  it('throws when backend is missing', () => {
    const { backend: _, ...rest } = minimal
    expect(() => validateChallengeConfig(rest as any)).toThrow(/backend/)
  })

  it('throws when app is missing', () => {
    const { app: _, ...rest } = minimal
    expect(() => validateChallengeConfig(rest as any)).toThrow(/app/)
  })

  it('throws when fs is missing', () => {
    const { fs: _, ...rest } = minimal
    expect(() => validateChallengeConfig(rest as any)).toThrow(/fs/)
  })

  it('throws when backend is an invalid value', () => {
    expect(() => validateChallengeConfig({ ...minimal, backend: 'django' as any })).toThrow(/backend/)
  })

  it('defaults source_visible to false when omitted', () => {
    const config = validateChallengeConfig(minimal)
    expect(config.source_visible).toBe(false)
  })

  it('accepts source_visible: true for white-box challenges', () => {
    const config = validateChallengeConfig({ ...minimal, source_visible: true })
    expect(config.source_visible).toBe(true)
  })

  it('accepts optional wasmModule field', () => {
    const config = validateChallengeConfig({ ...minimal, wasmModule: '/challenge/sqli-demo/runtime.wasm' })
    expect(config.wasmModule).toBe('/challenge/sqli-demo/runtime.wasm')
  })

  it('does not require wasmModule (auto-populated by build pipeline)', () => {
    const config = validateChallengeConfig(minimal)
    expect(config.wasmModule).toBeUndefined()
  })

  it('does not require flag_verifier or fs_key (now in WASM)', () => {
    // These fields should NOT be required — they are embedded in per-challenge WASM
    expect(() => validateChallengeConfig(minimal)).not.toThrow()
  })
})

describe('ChallengeConfig packages field', () => {
  const minimal = {
    title: 'Test',
    backend: 'flask' as const,
    app: './app.py',
    fs: { '/flag.txt': './flag.txt' },
  }

  it('defaults packages to [] when omitted', () => {
    const config = validateChallengeConfig(minimal)
    expect(config.packages).toEqual([])
  })

  it('parses packages array when provided', () => {
    const config = validateChallengeConfig({ ...minimal, packages: ['requests', 'pyjwt'] })
    expect(config.packages).toEqual(['requests', 'pyjwt'])
  })

  it('accepts empty packages array', () => {
    const config = validateChallengeConfig({ ...minimal, packages: [] })
    expect(config.packages).toEqual([])
  })

  it('accepts fastapi backend with packages', () => {
    const config = validateChallengeConfig({ ...minimal, backend: 'fastapi', packages: ['fastapi', 'anyio'] })
    expect(config.packages).toEqual(['fastapi', 'anyio'])
    expect(config.backend).toBe('fastapi')
  })
})

describe('Legacy field detection', () => {
  it('exports LEGACY_FIELDS constant', () => {
    expect(LEGACY_FIELDS).toContain('fs_key')
    expect(LEGACY_FIELDS).toContain('fsKeyParts')
    expect(LEGACY_FIELDS).toContain('encryptedFs')
    expect(LEGACY_FIELDS).toContain('flag_verifier')
  })
})
