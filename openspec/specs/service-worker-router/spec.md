# service-worker-router Specification

## Purpose

TBD - created by archiving change 'web-exploit-challenge-platform'. Update Purpose after archive.

## Requirements

### Requirement: Service Worker intercepts challenge-*.localhost requests

A Service Worker registered at the root scope SHALL intercept all `fetch` events where the request URL host matches the pattern `challenge-<slug>.localhost`. Requests not matching this pattern SHALL pass through to the network unchanged. This interception SHALL apply to both regular fetch requests and navigation requests (`request.mode === "navigate"`).

#### Scenario: Matching request is intercepted

- **WHEN** a fetch event fires with URL `https://challenge-sqli-basic.localhost/api/users`
- **THEN** the Service Worker SHALL intercept the request and NOT forward it to the network

#### Scenario: Non-matching request passes through

- **WHEN** a fetch event fires with URL `https://vitepress.dev/some/path`
- **THEN** the Service Worker SHALL call `event.respondWith` with the original network fetch

#### Scenario: Navigation request to challenge origin is intercepted

- **WHEN** a navigation fetch event fires with URL `https://challenge-sqli-basic.localhost/`
- **THEN** the Service Worker SHALL intercept it and route via MessageChannel relay


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
### Requirement: Router dispatches to correct runtime based on challenge type

Upon intercepting a request, the Service Worker SHALL look up the registered challenge's `port` (a `MessagePort` transferred from the challenge page at registration time). The Service Worker SHALL serialize the request into `{ method, url, headers, body }`, create a per-request `MessageChannel`, and send `{ type: 'HANDLE_REQUEST', method, url, headers, body, responsePort }` to the challenge's `port` with `responsePort` as a transferable. The Service Worker SHALL await the response on the other end of the per-request channel. All backend types (`flask`, `fastapi`, and `php`) SHALL use the same port-based `relayRequest(port, request)` mechanism for dispatching requests.

#### Scenario: Flask challenge request is dispatched via MessageChannel relay

- **WHEN** the active challenge has `backend: flask` and a request arrives at `challenge-<slug>.localhost`
- **THEN** the Service Worker SHALL send a `HANDLE_REQUEST` message to the challenge's registered `MessagePort` and await a `{ status, headers, body }` response

#### Scenario: FastAPI challenge request is dispatched via MessageChannel relay

- **WHEN** the active challenge has `backend: fastapi` and a request arrives at `challenge-<slug>.localhost`
- **THEN** the Service Worker SHALL send a `HANDLE_REQUEST` message to the challenge's registered `MessagePort` and await a `{ status, headers, body }` response

#### Scenario: PHP challenge request is dispatched via MessageChannel relay

- **WHEN** the active challenge has `backend: php` and a request arrives at `challenge-<slug>.localhost`
- **THEN** the Service Worker SHALL send a `HANDLE_REQUEST` message to the challenge's registered `MessagePort` and await a `{ status, headers, body }` response, using the same `relayRequest(port, request)` mechanism as Python backends

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

When a challenge page mounts, it SHALL send a `postMessage` to the Service Worker containing `{ type: 'REGISTER_CHALLENGE', slug: string, backend: string, port: MessagePort }` with `port` in the transferables array. The `port` is the page's end of a `MessageChannel` used for request relay. When the challenge page unmounts, it SHALL send `{ type: 'UNREGISTER_CHALLENGE', slug: string }`.

#### Scenario: Registration includes MessagePort and is acknowledged

- **WHEN** the challenge page sends `REGISTER_CHALLENGE` with a `MessagePort` transferable
- **THEN** the Service Worker SHALL store the slug-to-`{ backend, port }` mapping and reply with `{ type: 'REGISTERED' }`

#### Scenario: Unregistration clears the mapping

- **WHEN** the challenge page sends `UNREGISTER_CHALLENGE`
- **THEN** the Service Worker SHALL remove the slug-to-backend mapping, and subsequent requests to that slug SHALL return HTTP 503


<!-- @trace
source: runtime-init-and-fastapi-challenge
updated: 2026-03-16
code:
  - scripts/challenge-keygen.ts
  - .vitepress/theme/components/TerminalPanel.vue
  - .vitepress/challenge/config.ts
  - docs/challenge/sqli-demo/flag.txt
  - package.json
  - tests/__mocks__/virtual-fs.ts
  - docs/challenge/php-demo/flag.txt
  - docs/challenge/sqli-demo/app.py
  - docs/challenge/fastapi-demo/app.py
  - docs/challenge/php-demo.md
  - vitest.config.ts
  - docs/challenge/sqli-demo.md
  - .vitepress/theme/components/BrowserPanel.vue
  - docs/challenge/php-demo/index.php
  - .vitepress/theme/components/RepeatPanel.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/workers/router.ts
  - .vitepress/theme/composables/usePythonRuntime.ts
  - docs/challenge/fastapi-demo/flag.txt
  - docs/public/challenge-sw.js
  - docs/challenge/fastapi-demo.md
  - .vitepress/challenge/plugin.ts
tests:
  - tests/unit/challenge/plugin.test.ts
  - tests/unit/workers/router.test.ts
  - tests/unit/composables/usePythonRuntime-packages.test.ts
  - tests/unit/challenge/config.test.ts
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

The Service Worker router source file SHALL be located at `.vitepress/workers/router.ts` (renamed from `.vitepress/sw/router.ts`). The compiled output path (`docs/public/challenge-sw.js`) and all runtime behaviors SHALL remain unchanged. Any build scripts or import references that pointed to `.vitepress/sw/` SHALL be updated to `.vitepress/workers/`. The Service Worker registration in `.vitepress/theme/index.ts` SHALL use `import.meta.env.BASE_URL` to construct the registration path as `${import.meta.env.BASE_URL}challenge-sw.js`, ensuring correct resolution when VitePress is configured with a non-root `base` path.

#### Scenario: Router test file imports from the new path

- **WHEN** the test suite at `tests/unit/workers/router.test.ts` imports the router module
- **THEN** the import SHALL resolve from `.vitepress/workers/router.ts` without error

#### Scenario: Compiled output is unaffected

- **WHEN** the service worker is compiled to `docs/public/challenge-sw.js`
- **THEN** the output file path and contents SHALL be identical to before the rename

#### Scenario: Service Worker registration respects VitePress base path

- **WHEN** VitePress is configured with `base: '/seclab/'`
- **THEN** the Service Worker SHALL be registered at `/seclab/challenge-sw.js`

#### Scenario: Service Worker registration works with default root base

- **WHEN** VitePress uses the default root base (`/`)
- **THEN** the Service Worker SHALL be registered at `/challenge-sw.js`


<!-- @trace
source: fix-build-settings
updated: 2026-03-25
code:
  - package.json
  - .github/workflows/release.yml
  - docs/shared/challenges.data.ts
  - tsconfig.json
  - .vitepress/theme/index.ts
-->

---
### Requirement: Service Worker waits for challenge registration on registry miss

When a fetch event arrives at the Service Worker and the target slug is not yet in the registry, the Service Worker SHALL NOT immediately return HTTP 503. Instead, it SHALL wait for a `REGISTER_CHALLENGE` message for that slug (with a timeout of 3 seconds). Once registration arrives, the Service Worker SHALL retry the request dispatch. If the timeout expires before registration, the Service Worker SHALL return HTTP 503.

#### Scenario: Fetch arrives before registration and succeeds after waiting

- **WHEN** a fetch event arrives for `challenge-<slug>.localhost` and the slug is not yet in the registry
- **AND** a `REGISTER_CHALLENGE` message for that slug arrives within 3 seconds
- **THEN** the Service Worker SHALL hold the fetch response, register the challenge, then dispatch the request and return the runtime's response

#### Scenario: Fetch times out waiting for registration and returns 503

- **WHEN** a fetch event arrives for `challenge-<slug>.localhost` and the slug is not yet in the registry
- **AND** no `REGISTER_CHALLENGE` message arrives within 3 seconds
- **THEN** the Service Worker SHALL return HTTP 503 with body `{ "error": "challenge not registered" }`

#### Scenario: Multiple concurrent fetches wait for the same slug registration

- **WHEN** multiple fetch events arrive for the same `challenge-<slug>.localhost` before registration
- **AND** a `REGISTER_CHALLENGE` message for that slug subsequently arrives
- **THEN** all waiting fetch requests SHALL be unblocked and dispatched after registration


<!-- @trace
source: fix-challenge-registration-race
updated: 2026-03-22
code:
  - docs/public/challenge-sw.js
  - .vitepress/workers/router.ts
tests:
  - tests/unit/workers/router.test.ts
-->


<!-- @trace
source: fix-challenge-registration-race
updated: 2026-03-22
code:
  - docs/public/challenge-sw.js
  - .vitepress/workers/router.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
tests:
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/workers/router.test.ts
-->

---
### Requirement: Service Worker handles navigation requests from iframe link clicks

The Service Worker SHALL handle `fetch` events with `request.mode === "navigate"` for URLs matching `challenge-<slug>.localhost`. Navigation requests SHALL be treated identically to regular fetch requests: routed through the registered challenge's `MessagePort` relay. The Service Worker SHALL NOT distinguish between navigation and non-navigation requests for challenge-origin URLs.

#### Scenario: iframe link click navigation request is intercepted

- **WHEN** a link inside the Browser Panel iframe is clicked, triggering a navigation fetch to `https://challenge-<slug>.localhost/path`
- **THEN** the Service Worker SHALL intercept the navigation request, relay it via MessageChannel, and return the response so the page-side handler can update the iframe

#### Scenario: Navigation request outside challenge origin passes through

- **WHEN** a navigation fetch event fires for a URL that does not match `challenge-*.localhost`
- **THEN** the Service Worker SHALL NOT intercept it and SHALL pass it through to the network

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