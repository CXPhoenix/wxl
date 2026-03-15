import { describe, it, expect } from 'vitest'
import { useFlagVerifier } from '../../../.vitepress/challenge/flag-verifier'

// Pre-computed verifier: PBKDF2-HMAC-SHA256("FLAG{test}", "sqli-basic", 100000)
// We'll generate this from the implementation and use it as the known value.
// For the RED test, we just need the module to not exist yet.

describe('useFlagVerifier', () => {
  it('returns true for the correct flag', async () => {
    // We derive the verifier first, then test verification
    const { deriveVerifier, verify } = useFlagVerifier('sqli-basic')
    const verifier = await deriveVerifier('FLAG{test_secret}')
    expect(await verify('FLAG{test_secret}', verifier)).toBe(true)
  })

  it('returns false for an incorrect flag', async () => {
    const { deriveVerifier, verify } = useFlagVerifier('sqli-basic')
    const verifier = await deriveVerifier('FLAG{test_secret}')
    expect(await verify('FLAG{wrong}', verifier)).toBe(false)
  })

  it('returns false for an empty string', async () => {
    const { deriveVerifier, verify } = useFlagVerifier('sqli-basic')
    const verifier = await deriveVerifier('FLAG{test_secret}')
    expect(await verify('', verifier)).toBe(false)
  })

  it('different challenge slugs produce different verifiers for the same flag', async () => {
    const { deriveVerifier: d1 } = useFlagVerifier('challenge-a')
    const { deriveVerifier: d2 } = useFlagVerifier('challenge-b')
    const v1 = await d1('FLAG{same}')
    const v2 = await d2('FLAG{same}')
    expect(v1).not.toBe(v2)
  })
})
