/**
 * challenge-keygen.ts
 *
 * Pre-processes challenge markdown files:
 *   1. Generates a random AES-256 key (64 hex chars)
 *   2. Reads the app source file and all FS entries
 *   3. Encrypts each file with AES-GCM-256 → base64(iv || ct || tag)
 *   4. Derives a PBKDF2-SHA256 flag_verifier from /flag.txt content
 *   5. Splits the key into 3 fsKeyParts fragments
 *   6. Writes all processed fields back into the frontmatter
 *
 * Usage:
 *   pnpm challenge:keygen [slug]          # process one challenge
 *   pnpm challenge:keygen                 # process all challenges
 *
 * Re-running is safe — already-processed challenges (no PLACEHOLDER) are skipped.
 * Pass --force to re-key a specific challenge.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseDocument, stringify as yamlStringify } from 'yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const ROOT       = resolve(__dirname, '..')
const CHALLENGES = resolve(ROOT, 'docs', 'challenge')
const PLACEHOLDER = 'PLACEHOLDER_RUN_pnpm_challenge_keygen'

// ─── CLI args ──────────────────────────────────────────────────────────────

const args   = process.argv.slice(2)
const force  = args.includes('--force')
const target = args.find((a) => !a.startsWith('-')) // optional slug filter

// ─── Crypto helpers (Web Crypto, available in Node 18+) ───────────────────

function randomHex(bytes: number): string {
  const buf = globalThis.crypto.getRandomValues(new Uint8Array(bytes))
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

async function aesGcmEncrypt(keyBytes: Uint8Array, plaintext: Uint8Array): Promise<string> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))
  const key = await globalThis.crypto.subtle.importKey(
    'raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt'],
  )
  const ct = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  const combined = new Uint8Array(iv.length + ct.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ct), iv.length)
  return btoa(String.fromCharCode(...combined))
}

async function deriveFlagVerifier(flag: string, slug: string): Promise<string> {
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw', new TextEncoder().encode(flag.trim()), 'PBKDF2', false, ['deriveBits'],
  )
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(slug), iterations: 100_000 },
    keyMaterial, 256,
  )
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function splitKey(hex: string): string[] {
  const len = hex.length
  const a = Math.floor(len * 0.37)
  const b = Math.floor(len * 0.71)
  return [hex.slice(0, a), hex.slice(a, b), hex.slice(b)]
}

// ─── Frontmatter helpers ──────────────────────────────────────────────────

function parseMd(content: string): { fmRaw: string; body: string } | null {
  const m = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return null
  return { fmRaw: m[1], body: m[2] }
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function processChallenge(mdPath: string): Promise<void> {
  const slug = basename(mdPath, '.md')
  const raw  = readFileSync(mdPath, 'utf-8')
  const parsed = parseMd(raw)
  if (!parsed) { console.warn(`[skip] ${slug}: no frontmatter`); return }

  const doc = parseDocument(parsed.fmRaw)
  const fm  = doc.toJSON() as Record<string, unknown>

  const isPlaceholder =
    String(fm.fs_key ?? '').includes('PLACEHOLDER') ||
    String(fm.flag_verifier ?? '').includes('PLACEHOLDER')

  if (!isPlaceholder && !force) {
    console.log(`[skip] ${slug}: already processed (use --force to re-key)`)
    return
  }

  // Resolve source directory relative to the .md file
  const baseDir = dirname(mdPath)

  // Read app file
  const appRef = String(fm.app ?? '')
  const appPath = resolve(baseDir, appRef)
  if (!existsSync(appPath)) {
    console.warn(`[skip] ${slug}: app file not found: ${appPath}`)
    return
  }
  const appContent = readFileSync(appPath, 'utf-8')

  // Read fs entries
  const fsMap = (fm.fs ?? {}) as Record<string, string>
  const fileContents: Record<string, string> = { [basename(appRef)]: appContent }
  for (const [, ref] of Object.entries(fsMap)) {
    const p = resolve(baseDir, ref)
    if (!existsSync(p)) {
      console.warn(`[skip] ${slug}: fs file not found: ${p}`)
      return
    }
    fileContents[basename(ref)] = readFileSync(p, 'utf-8')
  }

  // Derive flag_verifier from /flag.txt content
  const flagEntry = Object.entries(fsMap).find(([vpath]) => vpath === '/flag.txt')
  if (!flagEntry) {
    console.warn(`[skip] ${slug}: no /flag.txt entry in fs map`)
    return
  }
  const flagContent = fileContents[basename(flagEntry[1])]
  const flagVerifier = await deriveFlagVerifier(flagContent, slug)

  // Generate AES key
  const fsKey = randomHex(32)
  const keyBytes = hexToBytes(fsKey)

  // Encrypt all FS entries
  const encryptedFs: Record<string, string> = {}
  for (const [vpath, ref] of Object.entries(fsMap)) {
    const content = fileContents[basename(ref)] ?? ''
    encryptedFs[vpath] = await aesGcmEncrypt(keyBytes, new TextEncoder().encode(content))
  }

  // Encrypt app code under reserved '__app__' key
  encryptedFs['__app__'] = await aesGcmEncrypt(keyBytes, new TextEncoder().encode(appContent))

  const fsKeyParts = splitKey(fsKey)

  // Update frontmatter fields
  doc.set('fs_key', fsKey)
  doc.set('flag_verifier', flagVerifier)
  doc.set('fsKeyParts', fsKeyParts)
  doc.set('encryptedFs', encryptedFs)

  const newFm = doc.toString({ lineWidth: 0 })
  const newContent = `---\n${newFm}---\n${parsed.body}`
  writeFileSync(mdPath, newContent, 'utf-8')

  console.log(`[done]  ${slug}`)
  console.log(`        flag_verifier: ${flagVerifier.slice(0, 16)}…`)
  console.log(`        fs_key: ${fsKey.slice(0, 12)}…`)
}

async function main(): Promise<void> {
  const files = readdirSync(CHALLENGES)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => !target || f === `${target}.md`)
    .map((f) => join(CHALLENGES, f))

  if (files.length === 0) {
    console.error(target ? `Challenge not found: ${target}` : 'No challenge files found')
    process.exit(1)
  }

  for (const f of files) {
    await processChallenge(f)
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
