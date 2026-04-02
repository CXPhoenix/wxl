## ADDED Requirements

### Requirement: ASGI bridge translates HTTP requests to ASGI scope and invokes Pyodide app

A Rust WASM module (`wasm-asgi`) SHALL accept an HTTP request descriptor `{ method, url, headers, body }` and construct a valid ASGI HTTP connection scope dict. It SHALL invoke the Pyodide-executed ASGI application callable with the scope, a `receive` callable that yields the request body, and a `send` callable that collects response events.

#### Scenario: GET request is translated to ASGI scope

- **WHEN** `wasm_asgi_handle({ method: "GET", url: "http://challenge-sqli.localhost/users", headers: {}, body: null })` is called
- **THEN** the module SHALL construct an ASGI scope with `type: "http"`, `method: "GET"`, `path: "/users"`, and the parsed query string, and invoke the Pyodide app callable

#### Scenario: POST request with body is forwarded

- **WHEN** `wasm_asgi_handle` is called with `method: "POST"` and a non-null body
- **THEN** the `receive` callable SHALL yield `{ type: "http.request", body: <bytes>, more_body: false }`


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

### Requirement: ASGI bridge collects response events and returns HTTP response

The `wasm-asgi` module SHALL collect all `http.response.start` and `http.response.body` events emitted by the app's `send` callable, assemble them into a complete HTTP response descriptor `{ status, headers, body }`, and return it to the Service Worker.

#### Scenario: Response is assembled from ASGI events

- **WHEN** the Pyodide app sends `http.response.start` with status 200 and headers, then `http.response.body` with body bytes
- **THEN** `wasm_asgi_handle` SHALL resolve with `{ status: 200, headers: [...], body: <bytes> }`

#### Scenario: Chunked response body is concatenated

- **WHEN** the Pyodide app sends multiple `http.response.body` events with `more_body: true`
- **THEN** all body chunks SHALL be concatenated before returning the final response


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

### Requirement: Pyodide app is initialized once per challenge session

The Python ASGI runtime SHALL load Pyodide and execute the challenge's `app_code` exactly once per challenge session (not per request). The resulting ASGI application callable SHALL be cached and reused for all subsequent requests.

#### Scenario: Pyodide is loaded lazily on first challenge access

- **WHEN** a user navigates to a Python challenge page for the first time
- **THEN** Pyodide SHALL be loaded and `app_code` SHALL be executed to produce the ASGI app callable

#### Scenario: Subsequent requests reuse cached app

- **WHEN** a second request arrives for the same challenge session
- **THEN** Pyodide SHALL NOT be re-loaded and the cached app callable SHALL be invoked directly


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

### Requirement: Virtual FS is mounted into Pyodide before app initialization

Before executing `app_code`, the ASGI runtime SHALL mount all decrypted FS entries (obtained from `wasm-fs`) into Pyodide's MEMFS. The mount point SHALL match the virtual paths defined in the challenge frontmatter.

#### Scenario: /flag.txt is accessible from Python app

- **WHEN** a challenge defines `fs: { /flag.txt: ./flag.txt }` and the app reads `open('/flag.txt').read()`
- **THEN** the Python code SHALL receive the decrypted flag content

#### Scenario: FS mount does not expose content to JavaScript

- **WHEN** the FS is mounted into Pyodide MEMFS
- **THEN** the decrypted content SHALL only be accessible inside the Pyodide Python environment, not via JavaScript `window` or `globalThis`

### Requirement: Python ASGI runtime installs micropip packages before app execution

When `PythonRuntime.initialize()` is called with a non-empty `packages` array, the runtime SHALL install all specified packages via `micropip.install()` inside Pyodide before executing `app_code`. Package installation SHALL complete before the app callable is invoked.

#### Scenario: Packages are installed before app code runs

- **WHEN** `PythonRuntime.initialize(appCode, fsEntries, ['flask', 'requests'])` is called
- **THEN** Pyodide SHALL execute `import micropip; await micropip.install(['flask', 'requests'])` before executing `appCode`

#### Scenario: Empty packages list skips micropip

- **WHEN** `PythonRuntime.initialize(appCode, fsEntries, [])` is called
- **THEN** the runtime SHALL NOT call `micropip.install` and SHALL execute `appCode` directly

#### Scenario: Package installation failure surfaces as initialization error

- **WHEN** a package in the `packages` list does not exist in the Pyodide package index
- **THEN** `initialize()` SHALL reject with an error describing the failed package name

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

### Requirement: ASGI bridge translates HTTP requests to ASGI scope and invokes Pyodide app

The ASGI bridge is implemented as inline Python code within Pyodide (in `usePythonRuntime.ts`), NOT as a Rust WASM module. The bridge SHALL accept an HTTP request descriptor `{ method, url, headers, body }` and construct a valid ASGI HTTP connection scope dict. It SHALL invoke the Pyodide-executed ASGI application callable with the scope, a `receive` callable that yields the request body, and a `send` callable that collects response events. The `chall-wasm/asgi-bridge/` Rust code exists but is used only for the custom section payload format, not for runtime ASGI bridging.

#### Scenario: GET request is translated to ASGI scope

- **WHEN** the ASGI bridge receives `{ method: "GET", url: "http://challenge-sqli.localhost/users", headers: {}, body: null }`
- **THEN** the bridge SHALL construct an ASGI scope with `type: "http"`, `method: "GET"`, `path: "/users"`, and the parsed query string, and invoke the Pyodide app callable

#### Scenario: POST request with body is forwarded

- **WHEN** the ASGI bridge receives a request with `method: "POST"` and a non-null body
- **THEN** the `receive` callable SHALL yield `{ type: "http.request", body: <bytes>, more_body: false }`

---
### Requirement: ASGI bridge collects response events and returns HTTP response

The ASGI bridge (implemented in inline Python within Pyodide) SHALL collect all `http.response.start` and `http.response.body` events emitted by the app's `send` callable, assemble them into a complete HTTP response descriptor `{ status, headers, body }`, and return it to the caller.

#### Scenario: Response is assembled from ASGI events

- **WHEN** the Pyodide app sends `http.response.start` with status 200 and headers, then `http.response.body` with body bytes
- **THEN** the bridge SHALL resolve with `{ status: 200, headers: [...], body: <bytes> }`

#### Scenario: Chunked response body is concatenated

- **WHEN** the Pyodide app sends multiple `http.response.body` events with `more_body: true`
- **THEN** all body chunks SHALL be concatenated before returning the final response

---
### Requirement: Pyodide app is initialized once per challenge session

The Python ASGI runtime SHALL load Pyodide and execute the challenge's `app_code` exactly once per challenge session (not per request). The resulting ASGI application callable SHALL be cached and reused for all subsequent requests.

#### Scenario: Pyodide is loaded lazily on first challenge access

- **WHEN** a user navigates to a Python challenge page for the first time
- **THEN** Pyodide SHALL be loaded and `app_code` SHALL be executed to produce the ASGI app callable

#### Scenario: Subsequent requests reuse cached app

- **WHEN** a second request arrives for the same challenge session
- **THEN** Pyodide SHALL NOT be re-loaded and the cached app callable SHALL be invoked directly

---
### Requirement: Virtual FS is mounted into Pyodide before app initialization

Before executing `app_code`, the ASGI runtime SHALL mount all decrypted FS entries (obtained from `wasm-fs`) into Pyodide's MEMFS. The mount point SHALL match the virtual paths defined in the challenge frontmatter.

#### Scenario: /flag.txt is accessible from Python app

- **WHEN** a challenge defines `fs: { /flag.txt: ./flag.txt }` and the app reads `open('/flag.txt').read()`
- **THEN** the Python code SHALL receive the decrypted flag content

#### Scenario: FS mount does not expose content to JavaScript

- **WHEN** the FS is mounted into Pyodide MEMFS
- **THEN** the decrypted content SHALL only be accessible inside the Pyodide Python environment, not via JavaScript `window` or `globalThis`

---
### Requirement: Python ASGI runtime module resides in .vitepress/composables

The `PythonRuntime` class SHALL be implemented in `.vitepress/theme/composables/usePythonRuntime.ts` (renamed from `chall-wasm/python-bridge/python-runtime.ts`). All consumers (`.vitepress/sw/router.ts` and test files) SHALL import from the new path. The public API — `initialize(appCode: string, fsEntries: Record<string, Uint8Array>, packages: string[]): Promise<void>` and `handleRequest(request: Request): Promise<Response>` — SHALL remain unchanged except for the `initialize()` signature update.

#### Scenario: Runtime module is importable from .vitepress/composables

- **WHEN** `.vitepress/sw/router.ts` imports `PythonRuntime`
- **THEN** the import path SHALL be `.vitepress/theme/composables/usePythonRuntime` and the import SHALL resolve without error

#### Scenario: Existing runtime behavior is preserved after migration

- **WHEN** `PythonRuntime.handleRequest()` is called with an HTTP request after migration
- **THEN** it SHALL produce the same response as before the migration (verified by existing test suite passing)

<!-- @trace
source: vitepress-platform-refactor
updated: 2026-03-15
code:
  - env.d.ts
  - vitest.config.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - tsconfig.json
  - docs/challenges/sqli-demo.md
  - package.json
  - .vitepress/theme/Layout.vue
  - .vitepress/theme/composables/usePhpRuntime.ts
  - chall-wasm/python-bridge/python-runtime.ts
  - docs/challenges/php-demo.md
  - .vitepress/theme/index.ts
  - .vitepress/config.mts
  - docs/challenges/challenges.data.ts
  - chall-wasm/php-bridge/php-runtime.ts
  - .vitepress/theme/layouts/ChallengeListLayout.vue
  - docs/challenges/index.md
tests:
  - .vitepress/theme/composables/usePhpRuntime-singleton.test.ts
  - chall-wasm/php-bridge/php-runtime.test.ts
  - .vitepress/theme/composables/usePhpRuntime-fs.test.ts
  - chall-wasm/python-bridge/python-runtime.test.ts
  - chall-wasm/php-bridge/php-runtime-fs.test.ts
  - .vitepress/theme/composables/usePythonRuntime-fs.test.ts
  - chall-wasm/python-bridge/python-runtime-request.test.ts
  - tests/e2e/flask-sqli.test.ts
  - .vitepress/theme/composables/usePhpRuntime-headers.test.ts
  - chall-wasm/python-bridge/python-runtime-fs.test.ts
  - chall-wasm/php-bridge/php-runtime-post.test.ts
  - .vitepress/theme/layouts/ChallengeLayout.test.ts
  - tests/e2e/php-demo.test.ts
  - .vitepress/theme/composables/usePythonRuntime-request.test.ts
  - .vitepress/theme/layouts/ChallengeListLayout.test.ts
  - chall-wasm/php-bridge/php-runtime-singleton.test.ts
  - .vitepress/theme/composables/usePhpRuntime.test.ts
  - .vitepress/theme/composables/usePhpRuntime-post.test.ts
  - .vitepress/theme/composables/usePythonRuntime.test.ts
  - chall-wasm/php-bridge/php-runtime-headers.test.ts
-->

---
### Requirement: Python ASGI runtime installs micropip packages before app execution

The `PythonRuntime.initialize()` method SHALL accept the following signature: `initialize(appCode: string, fsEntries: Record<string, Uint8Array> = {}, packages: string[] = []): Promise<void>`. The `fsEntries` parameter SHALL be a `Record<string, Uint8Array>` mapping virtual paths to binary content. The `packages` parameter SHALL be an optional array of package names to install via micropip.

#### Scenario: initialize called with all parameters

- **WHEN** `PythonRuntime.initialize(appCode, { '/flag.txt': flagBytes }, ['fastapi', 'anyio'])` is called
- **THEN** the runtime SHALL mount `/flag.txt` into Pyodide MEMFS, install `fastapi` and `anyio` via micropip, and execute `appCode`

#### Scenario: initialize called with defaults

- **WHEN** `PythonRuntime.initialize(appCode)` is called without fsEntries or packages
- **THEN** the runtime SHALL use empty defaults and execute `appCode` without mounting files or installing packages

---
### Requirement: E2E test mock completeness

All E2E test mock objects for `PyodideInstance` SHALL implement every method defined in the `PyodideInstance` interface, including `runPythonAsync`, `loadPackage`, `FS.writeFile`, `globals.get`, and `globals.set`.

#### Scenario: Flask SQLi E2E test mock includes loadPackage

- **WHEN** `PythonRuntime.initialize()` is called with a mock Pyodide in the Flask SQLi E2E test
- **THEN** the mock SHALL provide a `loadPackage` method that resolves to `undefined`
- **AND** the initialization SHALL complete without TypeError

#### Scenario: Flask SQLi E2E test mock includes globals.set

- **WHEN** `PythonRuntime` accesses `pyodide.globals.set` during initialization
- **THEN** the mock SHALL provide a `globals.set` method as a no-op function

<!-- @trace
source: fix-e2e-flask-sqli-mock
updated: 2026-03-25
tests:
  - tests/e2e/flask-sqli.test.ts
-->

---
### Requirement: Runtime handles HTTP request dispatch

The PythonRuntime.handleRequest() method SHALL read `X-Wxlsh-Cookie` from the incoming request headers and convert it to a standard `cookie` header in the ASGI scope. All `X-Wxlsh-*` headers SHALL be filtered out before passing to the ASGI bridge.

For response headers, the runtime SHALL collect all `set-cookie` headers from the ASGI response and transport them via a single `X-Wxlsh-Set-Cookie` header (newline-separated for multiple values) on the JS Response object. This bypasses the Fetch API restriction that silently drops `Set-Cookie` on programmatically constructed Response objects.

#### Scenario: Cookie header transport from browser to ASGI app

- **WHEN** a request arrives with header `X-Wxlsh-Cookie: session_user=guest`
- **THEN** the ASGI scope headers SHALL include `(b'cookie', b'session_user=guest')` and SHALL NOT include any `x-wxlsh-*` headers

#### Scenario: Set-Cookie header transport from ASGI app to browser

- **WHEN** the ASGI app sends an `http.response.start` event with header `(b'set-cookie', b'token=abc; Path=/')`
- **THEN** the JS Response SHALL include header `X-Wxlsh-Set-Cookie: token=abc; Path=/` and SHALL NOT include a `set-cookie` header


<!-- @trace
source: browser-cookie-and-redirect
updated: 2026-04-03
code:
  - docs/challenge/door-is-open/src/app.py
  - .vitepress/theme/components/BrowserPanel.vue
  - docs/challenge/door-is-open/index.md
  - docs/challenge/sqli-demo/index.md
  - docs/challenge/door-is-open/src/flag.txt
  - docs/challenge/fastapi-demo/index.md
  - .vitepress/theme/composables/useWxlsh.ts
  - .vitepress/theme/composables/usePythonRuntime.ts
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/components/RepeatPanel.vue
  - .wxl-creator/config.yaml
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/useChallengePersistence.ts
  - docs/challenge/php-demo/index.md
-->

---
### Requirement: Runtime initializes virtual filesystem from encrypted entries

When writing FS entries to the Pyodide filesystem, the runtime SHALL create parent directories (via `FS.mkdir()`) before writing files. This enables challenge source structures with subdirectories such as `src/templates/`.

#### Scenario: FS entry with nested path

- **WHEN** an FS entry has path `/templates/login.html`
- **THEN** the runtime SHALL create directory `/templates` before writing the file

<!-- @trace
source: browser-cookie-and-redirect
updated: 2026-04-03
code:
  - docs/challenge/door-is-open/src/app.py
  - .vitepress/theme/components/BrowserPanel.vue
  - docs/challenge/door-is-open/index.md
  - docs/challenge/sqli-demo/index.md
  - docs/challenge/door-is-open/src/flag.txt
  - docs/challenge/fastapi-demo/index.md
  - .vitepress/theme/composables/useWxlsh.ts
  - .vitepress/theme/composables/usePythonRuntime.ts
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/components/RepeatPanel.vue
  - .wxl-creator/config.yaml
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/useChallengePersistence.ts
  - docs/challenge/php-demo/index.md
-->