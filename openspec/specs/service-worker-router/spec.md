# service-worker-router Specification

## Purpose

TBD - created by archiving change 'web-exploit-challenge-platform'. Update Purpose after archive.

## Requirements

### Requirement: Service Worker intercepts challenge-*.localhost requests

A Service Worker registered at the root scope SHALL intercept all `fetch` events where the request URL host matches the pattern `challenge-<slug>.localhost`. Requests not matching this pattern SHALL pass through to the network unchanged.

#### Scenario: Matching request is intercepted

- **WHEN** a fetch event fires with URL `http://challenge-sqli-basic.localhost/api/users`
- **THEN** the Service Worker SHALL intercept the request and NOT forward it to the network

#### Scenario: Non-matching request passes through

- **WHEN** a fetch event fires with URL `https://vitepress.dev/some/path`
- **THEN** the Service Worker SHALL call `event.respondWith` with the original network fetch


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

---
### Requirement: Router dispatches to correct runtime based on challenge type

Upon intercepting a request, the Service Worker SHALL look up the active challenge's backend type (available via `postMessage` registration from the challenge page). If `backend` is `flask` or `fastapi`, the request SHALL be dispatched to the Python ASGI Runtime. If `backend` is `php`, the request SHALL be dispatched to the PHP Runtime.

#### Scenario: Flask challenge request is dispatched to Python runtime

- **WHEN** the active challenge has `backend: flask` and a request arrives at `challenge-<slug>.localhost`
- **THEN** the Service Worker SHALL invoke the Python ASGI Runtime with the request details

#### Scenario: PHP challenge request is dispatched to PHP runtime

- **WHEN** the active challenge has `backend: php` and a request arrives at `challenge-<slug>.localhost`
- **THEN** the Service Worker SHALL invoke the PHP Runtime with the request details

#### Scenario: Unknown backend type returns 501

- **WHEN** the active challenge has an unrecognized `backend` value
- **THEN** the Service Worker SHALL return an HTTP 501 Not Implemented response


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

---
### Requirement: Challenge page registers itself with the Service Worker

When a challenge page mounts, it SHALL send a `postMessage` to the Service Worker containing `{ type: 'REGISTER_CHALLENGE', slug: string, backend: string }`. When the challenge page unmounts, it SHALL send `{ type: 'UNREGISTER_CHALLENGE', slug: string }`.

#### Scenario: Registration is acknowledged

- **WHEN** the challenge page sends REGISTER_CHALLENGE
- **THEN** the Service Worker SHALL store the slug-to-backend mapping and reply with `{ type: 'REGISTERED' }`

#### Scenario: Unregistration clears the mapping

- **WHEN** the challenge page sends UNREGISTER_CHALLENGE
- **THEN** the Service Worker SHALL remove the slug-to-backend mapping, and subsequent requests to that slug SHALL return HTTP 503


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

---
### Requirement: Service Worker returns structured error responses on runtime failure

If the dispatched runtime throws an unhandled error, the Service Worker SHALL return an HTTP 500 response with a JSON body `{ error: string, stack?: string }` in development mode, or `{ error: "Internal Server Error" }` in production mode.

#### Scenario: Runtime exception produces 500 response

- **WHEN** the Python or PHP runtime throws an unhandled exception while processing a request
- **THEN** the Service Worker SHALL catch the exception and return HTTP 500 with error details


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

---
### Requirement: Service Worker source resides in .vitepress/workers/

The Service Worker router source file SHALL be located at `.vitepress/workers/router.ts` (renamed from `.vitepress/sw/router.ts`). The compiled output path (`docs/public/challenge-sw.js`) and all runtime behaviors SHALL remain unchanged. Any build scripts or import references that pointed to `.vitepress/sw/` SHALL be updated to `.vitepress/workers/`.

#### Scenario: Router test file imports from the new path

- **WHEN** the test suite at `tests/unit/workers/router.test.ts` imports the router module
- **THEN** the import SHALL resolve from `.vitepress/workers/router.ts` without error

#### Scenario: Compiled output is unaffected

- **WHEN** the service worker is compiled to `docs/public/challenge-sw.js`
- **THEN** the output file path and contents SHALL be identical to before the rename


<!-- @trace
source: vitepress-structure-refactor
updated: 2026-03-15
-->

<!-- @trace
source: vitepress-structure-refactor
updated: 2026-03-15
code:
  - .vitepress/theme/index.ts
  - .vitepress/theme/Layout.vue
  - .vitepress/workers/router.ts
  - .vitepress/sw/router.ts
  - docs/challenges/index.md
  - vitest.config.ts
  - .vitepress/theme/components/ChallengeList.vue
  - package.json
  - .vitepress/theme/layouts/ChallengeListLayout.vue
  - .vitepress/theme/components/ChallengeLayout.vue
tests:
  - .vitepress/theme/layouts/ChallengeLayout.test.ts
  - tests/unit/challenge/plugin-obfuscation.test.ts
  - tests/unit/challenge/flag-verifier.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/usePhpRuntime-post.test.ts
  - tests/unit/challenge/config.test.ts
  - tests/unit/components/ChallengeList.test.ts
  - tests/unit/composables/usePythonRuntime-request.test.ts
  - tests/unit/components/SourceViewer.test.ts
  - .vitepress/theme/composables/usePhpRuntime-singleton.test.ts
  - .vitepress/sw/router.test.ts
  - tests/e2e/php-demo.test.ts
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/composables/usePhpRuntime.test.ts
  - tests/e2e/flask-sqli.test.ts
  - tests/unit/components/TerminalPanel.test.ts
  - .vitepress/theme/layouts/ChallengeListLayout.test.ts
  - .vitepress/challenge/flag-verifier-global.test.ts
  - .vitepress/theme/composables/usePhpRuntime-fs.test.ts
  - tests/unit/composables/usePhpRuntime-headers.test.ts
  - .vitepress/theme/composables/usePhpRuntime-post.test.ts
  - .vitepress/theme/composables/usePythonRuntime.test.ts
  - tests/unit/challenge/plugin.test.ts
  - .vitepress/theme/components/SourceViewer.test.ts
  - .vitepress/theme/components/FlagSubmit.test.ts
  - tests/unit/challenge/flag-verifier-global.test.ts
  - .vitepress/challenge/plugin-obfuscation.test.ts
  - .vitepress/theme/composables/usePythonRuntime-request.test.ts
  - .vitepress/theme/components/RepeatPanel.test.ts
  - tests/unit/composables/usePhpRuntime-fs.test.ts
  - .vitepress/theme/components/TerminalPanel.test.ts
  - .vitepress/theme/components/ChallengeLayout.test.ts
  - tests/unit/composables/usePythonRuntime.test.ts
  - .vitepress/challenge/plugin.test.ts
  - tests/unit/components/RepeatPanel.test.ts
  - .vitepress/theme/components/BrowserPanel.test.ts
  - .vitepress/challenge/config.test.ts
  - tests/unit/composables/usePythonRuntime-fs.test.ts
  - .vitepress/theme/composables/usePhpRuntime-headers.test.ts
  - .vitepress/theme/composables/usePythonRuntime-fs.test.ts
  - tests/unit/composables/usePhpRuntime-singleton.test.ts
  - .vitepress/challenge/flag-verifier.test.ts
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/workers/router.test.ts
  - .vitepress/theme/composables/usePhpRuntime.test.ts
-->