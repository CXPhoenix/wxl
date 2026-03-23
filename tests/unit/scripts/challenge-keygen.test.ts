import { describe, it, expect } from 'vitest'
import {
  serializePayload,
  parsePayload,
  xorEncodeKey,
  hexToBytes,
  bytesToHex,
  deriveFlagVerifier,
  injectCustomSection,
  slugToSeed,
  type ChallengePayload,
} from '../../../scripts/challenge-keygen'

// ─── XOR masks matching Rust key_derive.rs compile-time constants ────────────
const MASK_A = new Uint8Array([
  0x7a, 0x3f, 0xb1, 0x92, 0xe4, 0x58, 0x0d, 0xc6,
  0xa3, 0x17, 0x6b, 0xf0, 0x2e, 0x89, 0xd4, 0x53,
  0x91, 0x46, 0xfc, 0x28, 0x7d, 0xe5, 0x0a, 0xb3,
  0xc7, 0x64, 0x1f, 0x8e, 0x39, 0xa2, 0xd0, 0x5b,
])

const MASK_B = new Uint8Array([
  0xd5, 0x4e, 0x23, 0xa7, 0x1b, 0x96, 0xf8, 0x42,
  0x0c, 0xe1, 0x5a, 0x3d, 0xb7, 0x60, 0x89, 0xc4,
  0x2f, 0x73, 0x18, 0xe6, 0x4a, 0x9d, 0x51, 0x0e,
  0xb2, 0xd8, 0x65, 0xf3, 0x47, 0x1c, 0xa9, 0x84,
])

const MASK_C = new Uint8Array([
  0x38, 0xc2, 0x67, 0x15, 0x9e, 0xab, 0xd3, 0x4f,
  0x71, 0x86, 0x2c, 0xe9, 0x54, 0x0b, 0xf7, 0xa1,
  0x63, 0xbd, 0x40, 0x95, 0xd2, 0x1e, 0x78, 0xc6,
  0x09, 0x4a, 0xf1, 0x27, 0x8c, 0xe3, 0x5d, 0xb0,
])

// ─── Binary payload serialization / parsing ─────────────────────────────────

describe('serializePayload', () => {
  it('produces binary starting with CHWD magic and version 1', () => {
    const payload: ChallengePayload = {
      slug: 'test',
      keyMaterial: new Uint8Array(32),
      verifier: new Uint8Array(0),
      entries: [],
      metadata: new Uint8Array(2), // '{}'
    }
    const buf = serializePayload(payload)
    // Magic: C H W D
    expect(buf[0]).toBe(0x43)
    expect(buf[1]).toBe(0x48)
    expect(buf[2]).toBe(0x57)
    expect(buf[3]).toBe(0x44)
    // Version
    expect(buf[4]).toBe(1)
  })

  it('roundtrips a payload with entries', () => {
    const payload: ChallengePayload = {
      slug: 'sqli-demo',
      keyMaterial: new Uint8Array(32).fill(0xAA),
      verifier: new TextEncoder().encode('abcdef1234567890'),
      entries: [
        { path: '/flag.txt', data: new Uint8Array([0x01, 0x02, 0x03]) },
        { path: '__app__', data: new Uint8Array([0x04, 0x05]) },
      ],
      metadata: new TextEncoder().encode('{"backend":"flask"}'),
    }
    const buf = serializePayload(payload)
    const parsed = parsePayload(buf)

    expect(parsed.slug).toBe('sqli-demo')
    expect(parsed.keyMaterial).toEqual(new Uint8Array(32).fill(0xAA))
    expect(new TextDecoder().decode(parsed.verifier)).toBe('abcdef1234567890')
    expect(parsed.entries.length).toBe(2)
    expect(parsed.entries[0].path).toBe('/flag.txt')
    expect(parsed.entries[0].data).toEqual(new Uint8Array([0x01, 0x02, 0x03]))
    expect(parsed.entries[1].path).toBe('__app__')
    expect(new TextDecoder().decode(parsed.metadata)).toBe('{"backend":"flask"}')
  })

  it('uses little-endian for multi-byte integers', () => {
    const payload: ChallengePayload = {
      slug: 'x'.repeat(256), // slug_len = 256, > 1 byte in LE
      keyMaterial: new Uint8Array(32),
      verifier: new Uint8Array(0),
      entries: [],
      metadata: new Uint8Array(0),
    }
    const buf = serializePayload(payload)
    // slug_len at offset 5-6: 256 = 0x0100 LE → [0x00, 0x01]
    expect(buf[5]).toBe(0x00)
    expect(buf[6]).toBe(0x01)
  })

  it('roundtrips empty entries and metadata', () => {
    const payload: ChallengePayload = {
      slug: 'empty',
      keyMaterial: new Uint8Array(32),
      verifier: new Uint8Array(0),
      entries: [],
      metadata: new Uint8Array(0),
    }
    const buf = serializePayload(payload)
    const parsed = parsePayload(buf)
    expect(parsed.slug).toBe('empty')
    expect(parsed.entries.length).toBe(0)
    expect(parsed.metadata.length).toBe(0)
  })
})

describe('parsePayload', () => {
  it('rejects invalid magic', () => {
    const buf = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x01])
    expect(() => parsePayload(buf)).toThrow(/magic/)
  })

  it('rejects unsupported version', () => {
    const buf = new Uint8Array([0x43, 0x48, 0x57, 0x44, 99, 0, 0])
    expect(() => parsePayload(buf)).toThrow(/version/)
  })

  it('rejects truncated data', () => {
    expect(() => parsePayload(new Uint8Array([0x43, 0x48, 0x57]))).toThrow()
  })
})

// ─── XOR key encoding ───────────────────────────────────────────────────────

describe('xorEncodeKey', () => {
  it('produces encoded key different from input', () => {
    const key = new Uint8Array(32).fill(0x42)
    const encoded = xorEncodeKey(key)
    expect(encoded).not.toEqual(key)
    expect(encoded.length).toBe(32)
  })

  it('is reversible (XOR is self-inverse)', () => {
    const key = new Uint8Array(32)
    crypto.getRandomValues(key)
    const encoded = xorEncodeKey(key)
    const decoded = xorEncodeKey(encoded) // XOR again = original
    expect(decoded).toEqual(key)
  })

  it('matches Rust key_derive.rs masks', () => {
    // Verify that xorEncodeKey(key) = key XOR MASK_A XOR MASK_B XOR MASK_C
    const key = new Uint8Array(32).fill(0xFF)
    const encoded = xorEncodeKey(key)
    const expected = new Uint8Array(32)
    for (let i = 0; i < 32; i++) {
      expected[i] = key[i] ^ MASK_A[i] ^ MASK_B[i] ^ MASK_C[i]
    }
    expect(encoded).toEqual(expected)
  })

  it('rejects key that is not 32 bytes', () => {
    expect(() => xorEncodeKey(new Uint8Array(16))).toThrow()
    expect(() => xorEncodeKey(new Uint8Array(0))).toThrow()
  })
})

// ─── Hex conversion utilities ───────────────────────────────────────────────

describe('hexToBytes', () => {
  it('converts hex string to bytes', () => {
    expect(hexToBytes('deadbeef')).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))
  })

  it('handles all zeros', () => {
    expect(hexToBytes('00000000')).toEqual(new Uint8Array([0, 0, 0, 0]))
  })
})

describe('bytesToHex', () => {
  it('converts bytes to hex string', () => {
    expect(bytesToHex(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))).toBe('deadbeef')
  })
})

// ─── Flag verifier ──────────────────────────────────────────────────────────

describe('deriveFlagVerifier', () => {
  it('produces a 32-byte hash as Uint8Array', async () => {
    const result = await deriveFlagVerifier('FLAG{test}', 'test-slug')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('is deterministic', async () => {
    const a = await deriveFlagVerifier('FLAG{x}', 'slug')
    const b = await deriveFlagVerifier('FLAG{x}', 'slug')
    expect(a).toEqual(b)
  })

  it('differs for different flags', async () => {
    const a = await deriveFlagVerifier('FLAG{a}', 'slug')
    const b = await deriveFlagVerifier('FLAG{b}', 'slug')
    expect(a).not.toEqual(b)
  })

  it('differs for different slugs', async () => {
    const a = await deriveFlagVerifier('FLAG{x}', 'slug-a')
    const b = await deriveFlagVerifier('FLAG{x}', 'slug-b')
    expect(a).not.toEqual(b)
  })
})

// ─── WASM custom section injection ──────────────────────────────────────────

describe('injectCustomSection', () => {
  // Minimal valid WASM module: magic + version + empty
  const MINIMAL_WASM = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, // \0asm magic
    0x01, 0x00, 0x00, 0x00, // version 1
  ])

  it('appends a custom section to the WASM binary', () => {
    const payload = new Uint8Array([0xDE, 0xAD])
    const result = injectCustomSection(MINIMAL_WASM, 'chall-data', payload)

    // Result should be longer than original
    expect(result.length).toBeGreaterThan(MINIMAL_WASM.length)

    // Should start with the original WASM
    expect(result.slice(0, MINIMAL_WASM.length)).toEqual(MINIMAL_WASM)

    // Custom section starts after original WASM
    const sectionStart = MINIMAL_WASM.length
    expect(result[sectionStart]).toBe(0x00) // custom section id
  })

  it('encodes section name correctly', () => {
    const payload = new Uint8Array([0x42])
    const result = injectCustomSection(MINIMAL_WASM, 'test', payload)

    // After WASM header (8 bytes):
    // 0x00 (section id)
    // LEB128 section size
    // LEB128 name length (4 for "test")
    // "test" bytes
    // payload

    let pos = MINIMAL_WASM.length
    expect(result[pos]).toBe(0x00) // section id
    pos++

    // section size = name_len_leb(1) + name(4) + payload(1) = 6
    expect(result[pos]).toBe(6) // section size (LEB128, fits in 1 byte)
    pos++

    // name length
    expect(result[pos]).toBe(4) // "test" = 4 bytes
    pos++

    // name bytes
    expect(new TextDecoder().decode(result.slice(pos, pos + 4))).toBe('test')
    pos += 4

    // payload
    expect(result[pos]).toBe(0x42)
  })

  it('preserves original WASM binary unchanged', () => {
    const original = new Uint8Array(MINIMAL_WASM)
    const payload = new Uint8Array(100).fill(0xFF)
    injectCustomSection(original, 'chall-data', payload)

    // original should be unchanged
    expect(original).toEqual(MINIMAL_WASM)
  })

  it('handles large payloads requiring multi-byte LEB128', () => {
    // Payload > 127 bytes requires 2-byte LEB128 for section size
    const payload = new Uint8Array(200).fill(0xAB)
    const result = injectCustomSection(MINIMAL_WASM, 'chall-data', payload)

    // Should contain the full payload
    expect(result.length).toBeGreaterThan(MINIMAL_WASM.length + 200)
  })
})

// ─── Slug-to-seed for wasm-mutate ───────────────────────────────────────────

describe('slugToSeed', () => {
  it('produces a deterministic seed from slug', () => {
    const a = slugToSeed('sqli-demo')
    const b = slugToSeed('sqli-demo')
    expect(a).toBe(b)
  })

  it('produces different seeds for different slugs', () => {
    const a = slugToSeed('sqli-demo')
    const b = slugToSeed('xss-demo')
    expect(a).not.toBe(b)
  })

  it('returns a 32-bit integer', () => {
    const seed = slugToSeed('test')
    expect(Number.isInteger(seed)).toBe(true)
  })
})
