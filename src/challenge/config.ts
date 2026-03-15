export type BackendType = 'flask' | 'fastapi' | 'php'

export interface ChallengeConfig {
  title: string
  flag_verifier: string
  fs_key: string
  backend: BackendType
  app: string
  fs: Record<string, string>
  source_visible: boolean
  // optional metadata
  difficulty?: string
  category?: string
  description?: string
}

const REQUIRED: (keyof ChallengeConfig)[] = ['title', 'flag_verifier', 'fs_key', 'backend', 'app', 'fs']
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
    flag_verifier: obj.flag_verifier as string,
    fs_key: obj.fs_key as string,
    backend: obj.backend as BackendType,
    app: obj.app as string,
    fs: obj.fs as Record<string, string>,
    source_visible: (obj.source_visible as boolean) ?? false,
    difficulty: obj.difficulty as string | undefined,
    category: obj.category as string | undefined,
    description: obj.description as string | undefined,
  }
}
