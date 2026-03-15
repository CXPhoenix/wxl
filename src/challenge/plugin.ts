import { validateChallengeConfig, type ChallengeConfig } from './config'
import { aesGcmEncrypt } from './crypto'

export interface ProcessedChallenge {
  title: string
  backend: string
  flagVerifier: string
  fsKeyParts: string[]          // obfuscated key fragments
  encryptedFs: Record<string, string>  // virtual path → base64(iv+ciphertext+tag)
  appSource?: string            // only present when source_visible: true
  difficulty?: string
  category?: string
  description?: string
  sourceVisible: boolean
}

/**
 * Core logic extracted from the VitePress plugin for testability.
 * `fileContents` is a map of filename (basename) → file content string.
 */
export async function processChallengeFrontmatter(
  raw: unknown,
  fileContents: Record<string, string>,
): Promise<ProcessedChallenge> {
  const config = validateChallengeConfig(raw)
  const keyBytes = hexToBytes(config.fs_key)

  // Encrypt all FS entries regardless of source_visible
  const encryptedFs: Record<string, string> = {}
  for (const [virtualPath, ref] of Object.entries(config.fs)) {
    const content = fileContents[ref] ?? ref  // support inline content too
    const encrypted = await aesGcmEncrypt(keyBytes, new TextEncoder().encode(content))
    encryptedFs[virtualPath] = encrypted
  }

  // Obfuscate fs_key into 3 fragments
  const fsKeyParts = splitKey(config.fs_key)

  const result: ProcessedChallenge = {
    title: config.title,
    backend: config.backend,
    flagVerifier: config.flag_verifier,
    fsKeyParts,
    encryptedFs,
    sourceVisible: config.source_visible,
    difficulty: config.difficulty,
    category: config.category,
    description: config.description,
  }

  // Only expose app source in white-box mode
  if (config.source_visible) {
    const appBasename = config.app.replace(/^.*[\\/]/, '')
    result.appSource = fileContents[appBasename] ?? fileContents[config.app]
  }

  return result
}

/** Split a hex key into 3 non-contiguous fragments */
function splitKey(hex: string): string[] {
  const len = hex.length
  const a = Math.floor(len * 0.37)
  const b = Math.floor(len * 0.71)
  return [hex.slice(0, a), hex.slice(a, b), hex.slice(b)]
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}
