/**
 * AES-GCM-256 encrypt using Web Crypto API (browser) or Node.js crypto (build time).
 * Returns base64(iv || ciphertext || authTag).
 */
export async function aesGcmEncrypt(keyBytes: Uint8Array, plaintext: Uint8Array): Promise<string> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))

  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  )

  const ciphertextBuf = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    plaintext,
  )

  // Concatenate iv + ciphertext(+authTag embedded by AES-GCM)
  const combined = new Uint8Array(iv.length + ciphertextBuf.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertextBuf), iv.length)

  return btoa(String.fromCharCode(...combined))
}

/**
 * AES-GCM-256 decrypt. Input is base64(iv || ciphertext || authTag).
 * Throws on auth failure.
 */
export async function aesGcmDecrypt(keyBytes: Uint8Array, b64: string): Promise<Uint8Array> {
  const combined = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)

  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  )

  const plainBuf = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext,
  )

  return new Uint8Array(plainBuf)
}
