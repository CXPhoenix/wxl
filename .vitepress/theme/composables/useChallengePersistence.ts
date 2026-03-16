import { openDB, type IDBPDatabase } from 'idb'

interface ScriptEntry {
  id: string
  name: string
  content: string
  createdAt: number
  updatedAt: number
}

interface HistoryEntry {
  id?: number
  command: string
  timestamp: number
}

interface ChallengeToolsDB {
  'code-scripts': ScriptEntry
  'terminal-history': HistoryEntry
}

const DB_NAME = 'challenge-tools'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<ChallengeToolsDB>> | null = null

function getDb(): Promise<IDBPDatabase<ChallengeToolsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ChallengeToolsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('code-scripts')) {
          db.createObjectStore('code-scripts', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('terminal-history')) {
          db.createObjectStore('terminal-history', { keyPath: 'id', autoIncrement: true })
        }
      },
    })
  }
  return dbPromise
}

function uuid(): string {
  return crypto.randomUUID()
}

export function useChallengePersistence() {
  // ─── Code Scripts ──────────────────────────────────────────────────────────

  async function saveScript(name: string, content: string): Promise<string> {
    const db = await getDb()
    const now = Date.now()
    const entry: ScriptEntry = { id: uuid(), name, content, createdAt: now, updatedAt: now }
    await db.put('code-scripts', entry)
    return entry.id
  }

  async function listScripts(): Promise<ScriptEntry[]> {
    const db = await getDb()
    const all = await db.getAll('code-scripts')
    return (all as ScriptEntry[]).sort((a, b) => b.updatedAt - a.updatedAt)
  }

  async function loadScript(id: string): Promise<string | null> {
    const db = await getDb()
    const entry = await db.get('code-scripts', id) as ScriptEntry | undefined
    return entry?.content ?? null
  }

  async function deleteScript(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('code-scripts', id)
  }

  // ─── Terminal History ──────────────────────────────────────────────────────

  async function appendHistory(command: string): Promise<void> {
    const db = await getDb()
    const all = await db.getAll('terminal-history') as HistoryEntry[]
    // Deduplicate consecutive identical commands
    if (all.length > 0 && all[all.length - 1].command === command) return
    await db.put('terminal-history', { command, timestamp: Date.now() })
  }

  async function loadHistory(limit = 200): Promise<string[]> {
    const db = await getDb()
    const all = await db.getAll('terminal-history') as HistoryEntry[]
    const recent = all.slice(-limit)
    return recent.map(e => e.command)
  }

  return { saveScript, listScripts, loadScript, deleteScript, appendHistory, loadHistory }
}
