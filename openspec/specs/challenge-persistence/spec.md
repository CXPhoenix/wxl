# challenge-persistence Specification

## Purpose

TBD - created by archiving change 'challenge-tools-evolution'. Update Purpose after archive.

## Requirements

### Requirement: useChallengePersistence manages an IndexedDB database for user tool data

The `useChallengePersistence` composable SHALL open (or create) an IndexedDB database named `challenge-tools` using the `idb` npm package. The database SHALL contain three object stores: `code-scripts` (keyPath: `id`, uuid string), `terminal-history` (keyPath: `id`, autoIncrement), and `attack-sessions` (keyPath: `challengeSlug`, string). The database version SHALL be `2`. The composable SHALL be importable from `.vitepress/theme/composables/useChallengePersistence.ts`.

The `upgrade` callback SHALL handle both fresh installs (version 0 → 2) and migrations from existing v1 installations (version 1 → 2) without destroying existing `code-scripts` or `terminal-history` data.

#### Scenario: Database is created on first use

- **WHEN** the composable is first used on a browser that has no prior IndexedDB data
- **THEN** the `challenge-tools` database SHALL be created at version 2 with all three object stores

#### Scenario: Existing v1 database is migrated without data loss

- **WHEN** the composable is used on a browser that already has the `challenge-tools` v1 database
- **THEN** the database SHALL be upgraded to version 2
- **AND** the existing `code-scripts` and `terminal-history` stores SHALL be preserved with their data intact
- **AND** the new `attack-sessions` store SHALL be added


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
### Requirement: Code scripts can be saved, listed, loaded, and deleted

The composable SHALL expose: `saveScript(name: string, content: string): Promise<string>` (returns the generated uuid), `listScripts(): Promise<ScriptEntry[]>` (returns all scripts sorted by `updatedAt` descending), `loadScript(id: string): Promise<string | null>`, and `deleteScript(id: string): Promise<void>`. Each script entry SHALL store `{ id, name, content, createdAt, updatedAt }`.

#### Scenario: Saving a script generates a unique id

- **WHEN** `saveScript("my-exploit", "print('hello')")` is called
- **THEN** the script SHALL be stored in IndexedDB with a unique uuid as id and the current timestamp in `createdAt` and `updatedAt`

#### Scenario: Listing scripts returns most recently updated first

- **WHEN** multiple scripts exist and `listScripts()` is called
- **THEN** the returned array SHALL be sorted by `updatedAt` descending

#### Scenario: Loading a non-existent script returns null

- **WHEN** `loadScript("unknown-id")` is called
- **THEN** the composable SHALL return `null` without throwing

#### Scenario: Deleting a script removes it from the store

- **WHEN** `deleteScript(id)` is called for an existing script
- **THEN** subsequent `listScripts()` SHALL NOT include that script


<!-- @trace
source: challenge-tools-evolution
updated: 2026-03-16
code:
  - Cargo.toml
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/composables/useWxlsh.ts
  - docs/public/challenge-sw.js
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - chall-wasm/wxlsh-parser/src/lib.rs
  - .vitepress/theme/composables/usePythonRuntime.ts
  - package.json
  - .vitepress/theme/components/RepeatPanel.vue
  - chall-wasm/wxlsh-parser/Cargo.toml
  - chall-wasm/wxlsh-parser/src/commands.rs
  - chall-wasm/wxlsh-parser/src/parser.rs
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/WxlshPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/components/TerminalPanel.test.ts
  - tests/unit/components/WxlshPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/components/CodeEditorPanel.test.ts
-->

---
### Requirement: Terminal history is persisted to IndexedDB

The composable SHALL expose: `appendHistory(command: string): Promise<void>` and `loadHistory(limit?: number): Promise<string[]>` (defaults to last 200 entries, ordered oldest-first). Duplicate consecutive commands SHALL be deduplicated (i.e., if the last stored command equals the new one, it SHALL NOT be appended again).

#### Scenario: Commands are stored in order

- **WHEN** the user runs commands `curl /a`, `curl /b`, `curl /c` in sequence
- **THEN** `loadHistory()` SHALL return them in that order

#### Scenario: Duplicate consecutive commands are not stored twice

- **WHEN** the user runs the same command twice in a row
- **THEN** only one entry SHALL be appended to the history store

#### Scenario: History is truncated to the most recent entries

- **WHEN** `loadHistory(50)` is called
- **THEN** only the 50 most recent commands SHALL be returned

<!-- @trace
source: challenge-tools-evolution
updated: 2026-03-16
code:
  - Cargo.toml
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/composables/useWxlsh.ts
  - docs/public/challenge-sw.js
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - chall-wasm/wxlsh-parser/src/lib.rs
  - .vitepress/theme/composables/usePythonRuntime.ts
  - package.json
  - .vitepress/theme/components/RepeatPanel.vue
  - chall-wasm/wxlsh-parser/Cargo.toml
  - chall-wasm/wxlsh-parser/src/commands.rs
  - chall-wasm/wxlsh-parser/src/parser.rs
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/components/WxlshPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - tests/unit/components/TerminalPanel.test.ts
  - tests/unit/components/WxlshPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/components/CodeEditorPanel.test.ts
-->

---
### Requirement: Attack sessions can be saved and loaded per challenge slug

The `useChallengePersistence` composable SHALL expose `saveAttackSession(session: AttackSession): Promise<void>` and `loadAttackSession(slug: string): Promise<AttackSession | null>`. These operate on the `attack-sessions` object store keyed by `challengeSlug`. Saving a session SHALL overwrite any existing session for that slug (upsert semantics).

#### Scenario: Saving a session persists it to IndexedDB

- **WHEN** `saveAttackSession(session)` is called
- **THEN** the session SHALL be stored in the `attack-sessions` store under `session.challengeSlug`

#### Scenario: Loading a non-existent session returns null

- **WHEN** `loadAttackSession("unknown-slug")` is called
- **THEN** the composable SHALL return `null` without throwing

#### Scenario: Saving overwrites a prior session for the same slug

- **WHEN** `saveAttackSession` is called twice for the same `challengeSlug`
- **THEN** only the most recently saved session SHALL be retained in IndexedDB

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