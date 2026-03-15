/**
 * Flag verification using PBKDF2-HMAC-SHA256.
 * The plaintext flag never leaves this module after derivation.
 */
export function useFlagVerifier(challengeSlug: string) {
  async function deriveVerifier(flag: string): Promise<string> {
    const keyMaterial = await globalThis.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(flag),
      'PBKDF2',
      false,
      ['deriveBits'],
    )
    const salt = new TextEncoder().encode(challengeSlug)
    const bits = await globalThis.crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 },
      keyMaterial,
      256,
    )
    return bufToHex(new Uint8Array(bits))
  }

  async function verify(submitted: string, storedVerifier: string): Promise<boolean> {
    const derived = await deriveVerifier(submitted)
    return constantTimeEqual(derived, storedVerifier)
  }

  return { deriveVerifier, verify }
}

function bufToHex(buf: Uint8Array): string {
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Constant-time string comparison to prevent timing attacks */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}
