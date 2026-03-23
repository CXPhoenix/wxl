import { useChallengePersistence, type AttackSession, type AttackEvent } from './useChallengePersistence'
import type { TrafficEntry } from './useTrafficLog'

export type { AttackSession, AttackEvent }

export interface ChallengeExportInfo {
  difficulty?: string
  category?: string
  backend?: string
  description?: string
  fullDescription?: string
}

interface SessionExportPayload {
  meta: {
    systemPrompt: string
    timezone: string
    exportedAt: string
  }
  challenge: {
    slug: string
    title: string
    difficulty?: string
    category?: string
    backend?: string
    description?: string
    fullDescription?: string
  }
  session: {
    startedAt: number
    solvedAt: number | null
    events: AttackEvent[]
  }
}

const WRITEUP_SYSTEM_PROMPT = `You are a CTF (Capture The Flag) writeup assistant. \
You will receive a structured attack session JSON file containing the challenge description, \
HTTP request/response history, flag attempts, and timing information. \
Your task is to produce a clear, educational writeup in Traditional Chinese (繁體中文) with the following structure:

1. **題目概述** (Challenge Overview): Summarize the challenge name, difficulty, category, and what the challenge is about based on the description.
2. **解題思路** (Approach): Explain the vulnerability identified and the attack strategy.
3. **攻擊步驟** (Attack Steps): Walk through the key HTTP requests step by step, explaining what was sent and what the response revealed.
4. **Flag 取得** (Flag Capture): Describe how the correct flag was finally obtained.
5. **學習重點** (Key Takeaways): Summarize what security concepts this challenge demonstrates.

Use the timestamps and timezone provided to reference when events occurred if relevant. \
Focus on clarity and educational value.`

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

  function exportSession(challengeInfo: ChallengeExportInfo): void {
    if (!session) return

    const now = new Date()
    // ISO 8601 with timezone offset (e.g. 2026-03-23T14:30:00+08:00)
    const off = -now.getTimezoneOffset()
    const sign = off >= 0 ? '+' : '-'
    const offH = String(Math.floor(Math.abs(off) / 60)).padStart(2, '0')
    const offM = String(Math.abs(off) % 60).padStart(2, '0')
    const pad2 = (n: number) => String(n).padStart(2, '0')
    const exportedAt = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}` +
      `T${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}${sign}${offH}:${offM}`
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const challenge: SessionExportPayload['challenge'] = {
      slug: session.challengeSlug,
      title: session.challengeTitle,
    }
    if (challengeInfo.difficulty !== undefined) challenge.difficulty = challengeInfo.difficulty
    if (challengeInfo.category !== undefined) challenge.category = challengeInfo.category
    if (challengeInfo.backend !== undefined) challenge.backend = challengeInfo.backend
    if (challengeInfo.description !== undefined) challenge.description = challengeInfo.description
    if (challengeInfo.fullDescription !== undefined) challenge.fullDescription = challengeInfo.fullDescription

    const payload: SessionExportPayload = {
      meta: {
        systemPrompt: WRITEUP_SYSTEM_PROMPT,
        timezone,
        exportedAt,
      },
      challenge,
      session: {
        startedAt: session.startedAt,
        solvedAt: session.solvedAt,
        events: session.events,
      },
    }

    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

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
