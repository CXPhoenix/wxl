export type BackendType = 'flask' | 'fastapi' | 'php'

export const LEGACY_FIELDS = ['fs_key', 'fsKeyParts', 'encryptedFs', 'flag_verifier'] as const

export interface ChallengeConfig {
  title: string
  backend: BackendType
  app: string
  fs: Record<string, string>
  source_visible: boolean
  packages: string[]
  wasmModule?: string
  // optional metadata
  difficulty?: string
  category?: string
  description?: string
}

const REQUIRED: (keyof ChallengeConfig)[] = ['title', 'backend', 'app', 'fs']
const VALID_BACKENDS: BackendType[] = ['flask', 'fastapi', 'php']

export function validateChallengeConfig(raw: unknown): ChallengeConfig {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('challenge config must be an object')
  }
  const obj = raw as Record<string, unknown>

  for (const field of REQUIRED) {
    if (obj[field] === undefined || obj[field] === null) {
      throw new Error(`missing required field: ${field}`)
    }
  }

  if (!VALID_BACKENDS.includes(obj.backend as BackendType)) {
    throw new Error(`backend must be one of ${VALID_BACKENDS.join(', ')}, got: ${obj.backend}`)
  }

  return {
    title: obj.title as string,
    backend: obj.backend as BackendType,
    app: obj.app as string,
    fs: obj.fs as Record<string, string>,
    source_visible: (obj.source_visible as boolean) ?? false,
    packages: (Array.isArray(obj.packages) ? obj.packages : []) as string[],
    wasmModule: obj.wasmModule as string | undefined,
    difficulty: obj.difficulty as string | undefined,
    category: obj.category as string | undefined,
    description: obj.description as string | undefined,
  }
}
