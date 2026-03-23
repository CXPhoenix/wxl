import { useChallengePersistence, type AttackSession, type AttackEvent } from './useChallengePersistence'
import type { TrafficEntry } from './useTrafficLog'

export type { AttackSession, AttackEvent }

export function useAttackSession(challengeSlug: string, challengeTitle: string) {
  const { saveAttackSession, loadAttackSession } = useChallengePersistence()
  let session: AttackSession | null = null

  async function init(): Promise<void> {
    const existing = await loadAttackSession(challengeSlug)

    if (existing && existing.solvedAt === null) {
      // Resume unsolved session
      session = existing
      return
    }

    // Create new session (first visit or solved session re-visit)
    const now = Date.now()
    session = {
      challengeSlug,
      challengeTitle,
      startedAt: now,
      solvedAt: null,
      events: [{ type: 'challenge_start', timestamp: now }],
    }
    await saveAttackSession(session)
  }

  async function addHttpEvent(entry: TrafficEntry, source: 'browser' | 'repeater'): Promise<void> {
    if (!session) return
    session.events.push({
      type: 'http_request',
      timestamp: Date.now(),
      source,
      id: entry.id,
      method: entry.method,
      url: entry.url,
      requestHeaders: entry.requestHeaders,
      requestBody: entry.requestBody,
      status: entry.status,
      responseHeaders: entry.responseHeaders,
      responseBody: entry.responseBody,
      duration: entry.duration,
    })
    await saveAttackSession(session)
  }

  async function addFlagAttempt(submitted: string, correct: boolean): Promise<void> {
    if (!session) return
    const now = Date.now()
    session.events.push({ type: 'flag_attempt', timestamp: now, submitted, correct })
    if (correct) {
      session.events.push({ type: 'challenge_solved', timestamp: now })
      session.solvedAt = now
    }
    await saveAttackSession(session)
  }

  function exportSession(): void {
    if (!session) return
    const json = JSON.stringify(session, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const filename = `attack-session-${challengeSlug}-${ts}.json`

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function getSession(): AttackSession | null {
    return session
  }

  return { init, getSession, addHttpEvent, addFlagAttempt, exportSession }
}
