# attack-session-tracking Specification

## Purpose

TBD - created by archiving change 'challenge-ux-and-attack-session'. Update Purpose after archive.

## Requirements

### Requirement: useAttackSession tracks a persistent attack session per challenge

The `useAttackSession` composable SHALL manage a single `AttackSession` object per challenge slug, persisted in IndexedDB. On initialization, it SHALL check for an existing unsolved session for the given slug; if found, it SHALL resume it by appending new events to the existing event list. If no session exists, it SHALL create a new one with a `challenge_start` event and `startedAt` timestamp. The composable SHALL be importable from `.vitepress/theme/composables/useAttackSession.ts`.

The `AttackSession` schema SHALL be:
```typescript
interface AttackSession {
  challengeSlug: string      // IndexedDB keyPath
  challengeTitle: string
  startedAt: number          // Unix ms
  solvedAt: number | null
  events: AttackEvent[]
}
```

#### Scenario: New session is created on first visit

- **WHEN** a challenger opens a challenge page for the first time (no prior session in IndexedDB)
- **THEN** a new `AttackSession` SHALL be created with `startedAt` set to the current timestamp
- **AND** a `challenge_start` event SHALL be appended as the first event
- **AND** `solvedAt` SHALL be `null`

#### Scenario: Existing unsolved session is resumed on return visit

- **WHEN** a challenger opens a challenge page and an unsolved session already exists in IndexedDB for that slug
- **THEN** the existing session SHALL be loaded and subsequent events SHALL be appended to it
- **AND** no new `challenge_start` event SHALL be added (the original `startedAt` is preserved)

#### Scenario: Solved session is archived and a new session is created on re-visit

- **WHEN** a challenger re-opens a challenge page after a session with `solvedAt` set already exists
- **THEN** a new session SHALL be created, overwriting the previous solved session in IndexedDB


<!-- @trace
source: challenge-ux-and-attack-session
updated: 2026-03-23
code:
  - CONTRIBUTE.md
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/FlagSubmit.vue
  - README.md
  - Usage.md
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
tests:
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/composables/useAttackSession.test.ts
-->

---
### Requirement: useAttackSession records HTTP request events with source attribution

The composable SHALL expose an `addHttpEvent(entry, source)` method that accepts a `TrafficEntry`-compatible object and a `source: 'browser' | 'repeater'` string. It SHALL append an `http_request` event to the current session and persist the updated session to IndexedDB.

The `http_request` event SHALL embed the full request and response data (method, URL, headers, body, status, duration) directly — not a reference to an in-memory `TrafficEntry` — to ensure cross-page-reload persistence.

#### Scenario: Browser request is recorded with source=browser

- **WHEN** a BrowserPanel request completes and `addHttpEvent` is called with `source: 'browser'`
- **THEN** an `http_request` event with `source: 'browser'` and the full request/response data SHALL be appended to the session

#### Scenario: Repeater request is recorded with source=repeater

- **WHEN** a RepeatPanel request completes and `addHttpEvent` is called with `source: 'repeater'`
- **THEN** an `http_request` event with `source: 'repeater'` SHALL be appended to the session


<!-- @trace
source: challenge-ux-and-attack-session
updated: 2026-03-23
code:
  - CONTRIBUTE.md
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/FlagSubmit.vue
  - README.md
  - Usage.md
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
tests:
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/composables/useAttackSession.test.ts
-->

---
### Requirement: useAttackSession records flag attempt events

The composable SHALL expose an `addFlagAttempt(submitted, correct)` method. It SHALL append a `flag_attempt` event containing the submitted flag text (plain text) and the boolean result.

If `correct` is `true`, the composable SHALL additionally append a `challenge_solved` event, set `solvedAt` to the current timestamp, and persist the finalized session to IndexedDB.

#### Scenario: Incorrect flag attempt is recorded

- **WHEN** a challenger submits an incorrect flag
- **THEN** a `flag_attempt` event with `correct: false` and the submitted text SHALL be appended
- **AND** `solvedAt` SHALL remain `null`

#### Scenario: Correct flag attempt finalizes the session

- **WHEN** a challenger submits the correct flag
- **THEN** a `flag_attempt` event with `correct: true` SHALL be appended
- **AND** a `challenge_solved` event SHALL be appended immediately after
- **AND** `solvedAt` SHALL be set to the current timestamp
- **AND** the session SHALL be persisted to IndexedDB with `solvedAt` set


<!-- @trace
source: challenge-ux-and-attack-session
updated: 2026-03-23
code:
  - CONTRIBUTE.md
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/FlagSubmit.vue
  - README.md
  - Usage.md
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
tests:
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/composables/useAttackSession.test.ts
-->

---
### Requirement: useAttackSession provides session export as JSON

The composable SHALL expose an `exportSession(challengeInfo)` method that accepts a `ChallengeExportInfo` object and triggers a browser file download. The download filename SHALL follow the pattern `attack-session-<slug>-<yyyymmdd-hhmmss>.json`.

The `ChallengeExportInfo` parameter SHALL have the following shape:
```typescript
interface ChallengeExportInfo {
  difficulty?: string
  category?: string
  backend?: string
  description?: string
  fullDescription?: string   // raw Markdown body from transformPageData
}
```

The exported JSON SHALL use a layered structure with three top-level keys:

```typescript
interface SessionExportPayload {
  meta: {
    systemPrompt: string       // hardcoded AI writeup prompt
    timezone: string           // from Intl.DateTimeFormat
    exportedAt: string         // ISO 8601 with timezone offset
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
```

The `meta.systemPrompt` SHALL be a module-level constant string hardcoded in `useAttackSession.ts` that instructs an AI to generate a structured CTF writeup from the attack session data.

The `meta.timezone` SHALL be obtained via `Intl.DateTimeFormat().resolvedOptions().timeZone` at export time.

The `meta.exportedAt` SHALL be an ISO 8601 string including the timezone offset (e.g., `2026-03-23T14:30:00+08:00`).

#### Scenario: Challenger downloads enriched attack session after solving

- **WHEN** `exportSession(challengeInfo)` is called with challenge metadata
- **THEN** the browser SHALL initiate a file download with a filename matching `attack-session-<slug>-*.json`
- **AND** the downloaded JSON SHALL contain `meta.systemPrompt` as a non-empty string
- **AND** the downloaded JSON SHALL contain `meta.timezone` matching the browser's IANA timezone
- **AND** the downloaded JSON SHALL contain `meta.exportedAt` as a valid ISO 8601 string
- **AND** `challenge.slug` and `challenge.title` SHALL be populated from the session
- **AND** `challenge.difficulty`, `challenge.category`, `challenge.backend`, `challenge.description`, and `challenge.fullDescription` SHALL be populated from the `challengeInfo` parameter
- **AND** `session.events` SHALL contain the complete event list from the `AttackSession`

#### Scenario: Export works when optional challenge fields are absent

- **WHEN** `exportSession(challengeInfo)` is called with a `ChallengeExportInfo` where optional fields are `undefined`
- **THEN** the exported JSON SHALL omit those fields from the `challenge` object
- **AND** the export SHALL complete without error

<!-- @trace
source: enhance-session-export-for-ai-writeup
updated: 2026-03-23
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/config.mts
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/challenge/plugin.ts
tests:
  - tests/unit/challenge/markdown-injection.test.ts
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
-->