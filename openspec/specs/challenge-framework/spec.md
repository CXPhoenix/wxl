## ADDED Requirements

### Requirement: Frontmatter schema defines challenge metadata

Each challenge page SHALL declare its configuration via YAML frontmatter in its `.md` file. The frontmatter MUST include: `title`, `flag_verifier` (PBKDF2 hash of flag), `fs_key` (64-byte hex AES-GCM key), `backend` (one of `flask`, `fastapi`, `php`), `app` (relative path to app source file), and `fs` (map of virtual paths to local file paths or inline strings). Optional fields: `difficulty`, `category`, `description`, `source_visible` (boolean, default `false`).

#### Scenario: Valid Flask challenge frontmatter is parsed

- **WHEN** a `.md` file contains frontmatter with `backend: flask`, `app: ./app.py`, `fs: { /flag.txt: ./flag.txt }`, `flag_verifier: <hash>`, and `fs_key: <hex>`
- **THEN** the VitePress plugin SHALL extract all fields without error and make them available to the challenge page component

#### Scenario: Missing required field is rejected at build time

- **WHEN** a `.md` file's frontmatter is missing `flag_verifier` or `fs_key`
- **THEN** the VitePress plugin SHALL throw a build error identifying the missing field and the file path


<!-- @trace
source: web-exploit-challenge-platform
updated: 2026-03-15
code:
  - chall-wasm/asgi-bridge/src/lib.rs
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - chall-wasm/asgi-bridge/Cargo.toml
  - chall-wasm/virtual-fs/src/tests.rs
  - .vitepress/theme/components/SourceViewer.vue
  - public/challenge-sw.js
  - .vitepress/challenge/crypto.ts
  - chall-wasm/asgi-bridge/src/scope.rs
  - chall-wasm/asgi-bridge/src/tests.rs
  - .vitepress/challenge/plugin.ts
  - chall-wasm/virtual-fs/Cargo.toml
  - chall-wasm/php-bridge/php-runtime.ts
  - chall-wasm/virtual-fs/src/wasm_api.rs
  - LICENSE
  - chall-wasm/python-bridge/python-runtime.ts
  - chall-wasm/virtual-fs/src/crypto.rs
  - chall-wasm/virtual-fs/src/idb.rs
  - .vitepress/config.mts
  - .vitepress/sw/router.ts
  - docs/challenges/sqli-demo.md
  - package.json
  - Cargo.toml
  - .vitepress/theme/components/TerminalPanel.vue
  - chall-wasm/asgi-bridge/src/events.rs
  - vitest.config.ts
  - .vitepress/theme/index.ts
  - .vitepress/theme/components/ChallengeLayout.vue
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/challenge/config.ts
  - .vitepress/challenge/flag-verifier.ts
  - docs/challenges/php-demo.md
  - chall-wasm/virtual-fs/src/lib.rs
tests:
  - chall-wasm/python-bridge/python-runtime-fs.test.ts
  - .vitepress/sw/router.test.ts
  - chall-wasm/php-bridge/php-runtime-fs.test.ts
  - tests/e2e/flask-sqli.test.ts
  - chall-wasm/php-bridge/php-runtime.test.ts
  - .vitepress/theme/components/SourceViewer.test.ts
  - chall-wasm/php-bridge/php-runtime-singleton.test.ts
  - .vitepress/theme/components/BrowserPanel.test.ts
  - .vitepress/challenge/flag-verifier-global.test.ts
  - .vitepress/challenge/config.test.ts
  - chall-wasm/php-bridge/php-runtime-headers.test.ts
  - .vitepress/challenge/flag-verifier.test.ts
  - chall-wasm/php-bridge/php-runtime-post.test.ts
  - chall-wasm/python-bridge/python-runtime-request.test.ts
  - .vitepress/challenge/plugin.test.ts
  - .vitepress/theme/components/ChallengeLayout.test.ts
  - tests/e2e/php-demo.test.ts
  - .vitepress/theme/components/FlagSubmit.test.ts
  - .vitepress/theme/components/RepeatPanel.test.ts
  - .vitepress/theme/components/TerminalPanel.test.ts
  - .vitepress/challenge/plugin-obfuscation.test.ts
  - chall-wasm/python-bridge/python-runtime.test.ts
-->

### Requirement: VitePress plugin processes challenge frontmatter at build time

A VitePress plugin SHALL transform each challenge page by: reading referenced app source files, reading referenced FS content files, encrypting FS content with AES-GCM using `fs_key`, and embedding the encrypted FS blob into the page's hydration data. The plaintext flag SHALL NOT appear anywhere in build output.

#### Scenario: Black-box challenge app source is encrypted

- **WHEN** the plugin processes a challenge with `source_visible: false` (or omitted) and `app: ./challenges/sqli/app.py`
- **THEN** the plugin SHALL encrypt the app source file content and SHALL NOT embed it as readable plaintext in build output

#### Scenario: White-box challenge app source is embedded as plaintext

- **WHEN** the plugin processes a challenge with `source_visible: true` and `app: ./challenges/sqli/app.py`
- **THEN** the plugin SHALL embed the app source file as readable plaintext in build output, making it accessible to the challenge page's source viewer

#### Scenario: FS files are always encrypted regardless of source_visible

- **WHEN** the plugin processes any challenge regardless of `source_visible` value
- **THEN** all entries in the `fs` map (including `/flag.txt`) SHALL be encrypted with AES-GCM-256 using `fs_key`

#### Scenario: FS content is encrypted before embedding

- **WHEN** the plugin processes a challenge with `fs: { /flag.txt: ./flag.txt }` and `fs_key: <hex>`
- **THEN** each FS file's content SHALL be encrypted with AES-GCM-256 using `fs_key` and the resulting ciphertext (with IV and auth tag) SHALL be embedded in build output

#### Scenario: fs_key is obfuscated in build output

- **WHEN** the plugin embeds `fs_key` into build output
- **THEN** the key SHALL be split into at least 3 non-contiguous string segments, preventing direct grep discovery of the full key


<!-- @trace
source: web-exploit-challenge-platform
updated: 2026-03-15
code:
  - chall-wasm/asgi-bridge/src/lib.rs
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - chall-wasm/asgi-bridge/Cargo.toml
  - chall-wasm/virtual-fs/src/tests.rs
  - .vitepress/theme/components/SourceViewer.vue
  - public/challenge-sw.js
  - .vitepress/challenge/crypto.ts
  - chall-wasm/asgi-bridge/src/scope.rs
  - chall-wasm/asgi-bridge/src/tests.rs
  - .vitepress/challenge/plugin.ts
  - chall-wasm/virtual-fs/Cargo.toml
  - chall-wasm/php-bridge/php-runtime.ts
  - chall-wasm/virtual-fs/src/wasm_api.rs
  - LICENSE
  - chall-wasm/python-bridge/python-runtime.ts
  - chall-wasm/virtual-fs/src/crypto.rs
  - chall-wasm/virtual-fs/src/idb.rs
  - .vitepress/config.mts
  - .vitepress/sw/router.ts
  - docs/challenges/sqli-demo.md
  - package.json
  - Cargo.toml
  - .vitepress/theme/components/TerminalPanel.vue
  - chall-wasm/asgi-bridge/src/events.rs
  - vitest.config.ts
  - .vitepress/theme/index.ts
  - .vitepress/theme/components/ChallengeLayout.vue
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/challenge/config.ts
  - .vitepress/challenge/flag-verifier.ts
  - docs/challenges/php-demo.md
  - chall-wasm/virtual-fs/src/lib.rs
tests:
  - chall-wasm/python-bridge/python-runtime-fs.test.ts
  - .vitepress/sw/router.test.ts
  - chall-wasm/php-bridge/php-runtime-fs.test.ts
  - tests/e2e/flask-sqli.test.ts
  - chall-wasm/php-bridge/php-runtime.test.ts
  - .vitepress/theme/components/SourceViewer.test.ts
  - chall-wasm/php-bridge/php-runtime-singleton.test.ts
  - .vitepress/theme/components/BrowserPanel.test.ts
  - .vitepress/challenge/flag-verifier-global.test.ts
  - .vitepress/challenge/config.test.ts
  - chall-wasm/php-bridge/php-runtime-headers.test.ts
  - .vitepress/challenge/flag-verifier.test.ts
  - chall-wasm/php-bridge/php-runtime-post.test.ts
  - chall-wasm/python-bridge/python-runtime-request.test.ts
  - .vitepress/challenge/plugin.test.ts
  - .vitepress/theme/components/ChallengeLayout.test.ts
  - tests/e2e/php-demo.test.ts
  - .vitepress/theme/components/FlagSubmit.test.ts
  - .vitepress/theme/components/RepeatPanel.test.ts
  - .vitepress/theme/components/TerminalPanel.test.ts
  - .vitepress/challenge/plugin-obfuscation.test.ts
  - chall-wasm/python-bridge/python-runtime.test.ts
-->

### Requirement: Flag verification uses PBKDF2 without storing plaintext flag

The challenge framework SHALL verify submitted flags by computing `PBKDF2-HMAC-SHA256(submitted_flag, challenge_slug, iterations=100000)` and comparing the result against the stored `flag_verifier` value. The comparison SHALL use a constant-time equality check.

#### Scenario: Correct flag is accepted

- **WHEN** a user submits the correct flag string
- **THEN** the system SHALL compute its PBKDF2 hash and compare it to `flag_verifier`, returning a success state

#### Scenario: Incorrect flag is rejected

- **WHEN** a user submits an incorrect flag string
- **THEN** the system SHALL return a failure state without revealing the correct flag or any timing information

#### Scenario: Flag verifier is never logged

- **WHEN** the challenge page initializes
- **THEN** `flag_verifier` SHALL NOT be accessible via `window`, `console`, or any global JavaScript variable

## Requirements


<!-- @trace
source: web-exploit-challenge-platform
updated: 2026-03-15
code:
  - chall-wasm/asgi-bridge/src/lib.rs
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - chall-wasm/asgi-bridge/Cargo.toml
  - chall-wasm/virtual-fs/src/tests.rs
  - .vitepress/theme/components/SourceViewer.vue
  - public/challenge-sw.js
  - .vitepress/challenge/crypto.ts
  - chall-wasm/asgi-bridge/src/scope.rs
  - chall-wasm/asgi-bridge/src/tests.rs
  - .vitepress/challenge/plugin.ts
  - chall-wasm/virtual-fs/Cargo.toml
  - chall-wasm/php-bridge/php-runtime.ts
  - chall-wasm/virtual-fs/src/wasm_api.rs
  - LICENSE
  - chall-wasm/python-bridge/python-runtime.ts
  - chall-wasm/virtual-fs/src/crypto.rs
  - chall-wasm/virtual-fs/src/idb.rs
  - .vitepress/config.mts
  - .vitepress/sw/router.ts
  - docs/challenges/sqli-demo.md
  - package.json
  - Cargo.toml
  - .vitepress/theme/components/TerminalPanel.vue
  - chall-wasm/asgi-bridge/src/events.rs
  - vitest.config.ts
  - .vitepress/theme/index.ts
  - .vitepress/theme/components/ChallengeLayout.vue
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/challenge/config.ts
  - .vitepress/challenge/flag-verifier.ts
  - docs/challenges/php-demo.md
  - chall-wasm/virtual-fs/src/lib.rs
tests:
  - chall-wasm/python-bridge/python-runtime-fs.test.ts
  - .vitepress/sw/router.test.ts
  - chall-wasm/php-bridge/php-runtime-fs.test.ts
  - tests/e2e/flask-sqli.test.ts
  - chall-wasm/php-bridge/php-runtime.test.ts
  - .vitepress/theme/components/SourceViewer.test.ts
  - chall-wasm/php-bridge/php-runtime-singleton.test.ts
  - .vitepress/theme/components/BrowserPanel.test.ts
  - .vitepress/challenge/flag-verifier-global.test.ts
  - .vitepress/challenge/config.test.ts
  - chall-wasm/php-bridge/php-runtime-headers.test.ts
  - .vitepress/challenge/flag-verifier.test.ts
  - chall-wasm/php-bridge/php-runtime-post.test.ts
  - chall-wasm/python-bridge/python-runtime-request.test.ts
  - .vitepress/challenge/plugin.test.ts
  - .vitepress/theme/components/ChallengeLayout.test.ts
  - tests/e2e/php-demo.test.ts
  - .vitepress/theme/components/FlagSubmit.test.ts
  - .vitepress/theme/components/RepeatPanel.test.ts
  - .vitepress/theme/components/TerminalPanel.test.ts
  - .vitepress/challenge/plugin-obfuscation.test.ts
  - chall-wasm/python-bridge/python-runtime.test.ts
-->

### Requirement: Frontmatter schema defines challenge metadata

Each challenge page SHALL declare its configuration via YAML frontmatter in its `.md` file. The frontmatter MUST include: `title`, `flag_verifier` (PBKDF2 hash of flag), `fs_key` (64-byte hex AES-GCM key), `backend` (one of `flask`, `fastapi`, `php`), `app` (relative path to app source file), and `fs` (map of virtual paths to local file paths or inline strings). Optional fields: `difficulty`, `category`, `description`, `source_visible` (boolean, default `false`).

#### Scenario: Valid Flask challenge frontmatter is parsed

- **WHEN** a `.md` file contains frontmatter with `backend: flask`, `app: ./app.py`, `fs: { /flag.txt: ./flag.txt }`, `flag_verifier: <hash>`, and `fs_key: <hex>`
- **THEN** the VitePress plugin SHALL extract all fields without error and make them available to the challenge page component

#### Scenario: Missing required field is rejected at build time

- **WHEN** a `.md` file's frontmatter is missing `flag_verifier` or `fs_key`
- **THEN** the VitePress plugin SHALL throw a build error identifying the missing field and the file path

---
### Requirement: VitePress plugin processes challenge frontmatter at build time

A VitePress plugin SHALL transform each challenge page by: reading referenced app source files, reading referenced FS content files, encrypting FS content with AES-GCM using `fs_key`, and embedding the encrypted FS blob into the page's hydration data. The plaintext flag SHALL NOT appear anywhere in build output.

#### Scenario: Black-box challenge app source is encrypted

- **WHEN** the plugin processes a challenge with `source_visible: false` (or omitted) and `app: ./challenges/sqli/app.py`
- **THEN** the plugin SHALL encrypt the app source file content and SHALL NOT embed it as readable plaintext in build output

#### Scenario: White-box challenge app source is embedded as plaintext

- **WHEN** the plugin processes a challenge with `source_visible: true` and `app: ./challenges/sqli/app.py`
- **THEN** the plugin SHALL embed the app source file as readable plaintext in build output, making it accessible to the challenge page's source viewer

#### Scenario: FS files are always encrypted regardless of source_visible

- **WHEN** the plugin processes any challenge regardless of `source_visible` value
- **THEN** all entries in the `fs` map (including `/flag.txt`) SHALL be encrypted with AES-GCM-256 using `fs_key`

#### Scenario: FS content is encrypted before embedding

- **WHEN** the plugin processes a challenge with `fs: { /flag.txt: ./flag.txt }` and `fs_key: <hex>`
- **THEN** each FS file's content SHALL be encrypted with AES-GCM-256 using `fs_key` and the resulting ciphertext (with IV and auth tag) SHALL be embedded in build output

#### Scenario: fs_key is obfuscated in build output

- **WHEN** the plugin embeds `fs_key` into build output
- **THEN** the key SHALL be split into at least 3 non-contiguous string segments, preventing direct grep discovery of the full key

---
### Requirement: Flag verification uses PBKDF2 without storing plaintext flag

The challenge framework SHALL verify submitted flags by computing `PBKDF2-HMAC-SHA256(submitted_flag, challenge_slug, iterations=100000)` and comparing the result against the stored `flag_verifier` value. The comparison SHALL use a constant-time equality check.

#### Scenario: Correct flag is accepted

- **WHEN** a user submits the correct flag string
- **THEN** the system SHALL compute its PBKDF2 hash and compare it to `flag_verifier`, returning a success state

#### Scenario: Incorrect flag is rejected

- **WHEN** a user submits an incorrect flag string
- **THEN** the system SHALL return a failure state without revealing the correct flag or any timing information

#### Scenario: Flag verifier is never logged

- **WHEN** the challenge page initializes
- **THEN** `flag_verifier` SHALL NOT be accessible via `window`, `console`, or any global JavaScript variable