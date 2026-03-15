import { describe, it, expect, beforeEach } from 'vitest'
import { useFlagVerifier } from '../../../.vitepress/challenge/flag-verifier'

describe('flag_verifier global exposure', () => {
  beforeEach(() => {
    // Clean up any accidental globals
    delete (globalThis as any).flag_verifier
    delete (globalThis as any).flagVerifier
    delete (globalThis as any).flag
  })

  it('useFlagVerifier does not attach anything to globalThis', async () => {
    const { deriveVerifier } = useFlagVerifier('test-challenge')
    const verifier = await deriveVerifier('FLAG{secret}')

    // Verify the verifier value is not on any global key
    const globalKeys = Object.keys(globalThis as any)
    for (const key of globalKeys) {
      const val = (globalThis as any)[key]
      if (typeof val === 'string') {
        expect(val).not.toBe(verifier)
        expect(val).not.toBe('FLAG{secret}')
      }
    }
  })

  it('the stored verifier hex is not accessible via window properties', async () => {
    const { deriveVerifier, verify } = useFlagVerifier('test-challenge')
    const verifier = await deriveVerifier('FLAG{secret}')

    // Verify still works (module internal state)
    expect(await verify('FLAG{secret}', verifier)).toBe(true)

    // But verifier is not on window
    expect((globalThis as any).flag_verifier).toBeUndefined()
    expect((globalThis as any).flagVerifier).toBeUndefined()
  })
})
