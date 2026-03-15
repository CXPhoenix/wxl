import { describe, it, expect } from 'vitest'
import { validateChallengeConfig } from './config'

describe('ChallengeConfig validation', () => {
  const minimal = {
    title: 'SQL Injection Basic',
    flag_verifier: 'abc123hash',
    fs_key: 'a'.repeat(64),
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

  it('throws when flag_verifier is missing', () => {
    const { flag_verifier: _, ...rest } = minimal
    expect(() => validateChallengeConfig(rest as any)).toThrow(/flag_verifier/)
  })

  it('throws when fs_key is missing', () => {
    const { fs_key: _, ...rest } = minimal
    expect(() => validateChallengeConfig(rest as any)).toThrow(/fs_key/)
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
})
