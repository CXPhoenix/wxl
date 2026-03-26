## ADDED Requirements

### Requirement: PHP Runtime executes challenge PHP code via php-wasm

The PHP Runtime SHALL use the existing `php-wasm` package (v0.0.8) to execute PHP challenge app code. The runtime SHALL be encapsulated in a `PhpRuntime` class that abstracts the php-wasm API version, enabling future upgrades without changes to the Service Worker.

`ChallengeLayout.vue` SHALL provide a `LoadPhpFn` callback to `PhpRuntime` that dynamically imports `php-wasm/PhpWeb.mjs`, instantiates a `PhpWeb` object, waits for the Emscripten binary to be ready, and returns a `PhpInstance`-compatible adapter. The adapter SHALL:

1. Capture stdout output by attaching an `output` event listener before calling `PhpWeb.run()` and removing it after resolution
2. Provide a `writeFile(path, data)` method that delegates to the Emscripten FS (`phpBinary.FS.writeFile`)
3. Return `{ output: string, headers: string[], exitCode: number }` where `headers` is always an empty array (php-wasm does not expose PHP `header()` calls)

#### Scenario: PHP script is executed and response is returned

- **WHEN** the Service Worker dispatches a request with `backend: php` to the PHP Runtime
- **THEN** the `PhpRuntime` class SHALL set up PHP superglobals (`$_SERVER`, `$_GET`, `$_POST`, `$_COOKIE`), execute the app's PHP file, capture the stdout output via the `output` event, and return it as the response body

#### Scenario: PHP challenge page loads without runtime error

- **WHEN** a user navigates to a PHP challenge page
- **THEN** the runtime SHALL initialize successfully (no "PHP runtime loader not configured" error) and `runtimeReady` SHALL become `true` after `PhpWeb` binary loads


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
source: fix-flask-php-runtime
updated: 2026-03-16
code:
  - tests/__mocks__/virtual-fs.ts
  - .vitepress/theme/composables/usePythonRuntime.ts
  - .vitepress/config.mts
  - docs/public/challenge-sw.js
  - docs/index.md
  - .vitepress/theme/layouts/ChallengeLayout.vue
tests:
  - tests/e2e/flask-sqli.test.ts
  - tests/unit/composables/usePythonRuntime-request.test.ts
  - tests/unit/composables/usePythonRuntime-packages.test.ts
-->

### Requirement: Virtual FS entries are mounted into php-wasm before execution

Before executing the PHP script, the PHP Runtime SHALL write all decrypted FS entries (from `wasm-fs`) into php-wasm's virtual filesystem. Each entry SHALL be accessible at its defined virtual path.

#### Scenario: /flag.txt is accessible from PHP

- **WHEN** a challenge defines `fs: { /flag.txt: ./flag.txt }` and the PHP script reads `file_get_contents('/flag.txt')`
- **THEN** the PHP code SHALL receive the decrypted flag content


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

### Requirement: PHP Runtime is initialized once per challenge session

The PHP Runtime SHALL initialize php-wasm exactly once per challenge session. Subsequent requests SHALL reuse the same php-wasm instance without re-initialization.

#### Scenario: Repeated requests reuse php-wasm instance

- **WHEN** a second HTTP request arrives for the same PHP challenge session
- **THEN** php-wasm SHALL NOT be re-initialized and the cached instance SHALL be used


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

### Requirement: PHP Runtime handles HTTP request method and body

The PHP Runtime SHALL populate PHP superglobals according to the incoming request: `$_GET` from query string, `$_POST` from form-encoded body, `$_SERVER['REQUEST_METHOD']` from HTTP method, and raw body accessible via `php://input`.

#### Scenario: POST data is available in $_POST

- **WHEN** a POST request with `Content-Type: application/x-www-form-urlencoded` body arrives
- **THEN** `$_POST` SHALL contain the decoded key-value pairs

#### Scenario: Raw body is accessible via php://input

- **WHEN** a POST request with `Content-Type: application/json` body arrives
- **THEN** `file_get_contents('php://input')` SHALL return the raw JSON string

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

### Requirement: PHP Runtime executes challenge PHP code via php-wasm

The PHP Runtime SHALL use the existing `php-wasm` package (v0.0.8) to execute PHP challenge app code. The runtime SHALL be encapsulated in a `PhpRuntime` class that abstracts the php-wasm API version, enabling future upgrades without changes to the Service Worker.

`ChallengeLayout.vue` SHALL provide a `LoadPhpFn` callback to `PhpRuntime` that dynamically imports `php-wasm/PhpWeb.mjs`, instantiates a `PhpWeb` object, waits for the Emscripten binary to be ready, and returns a `PhpInstance`-compatible adapter. The adapter SHALL:

1. Capture stdout output by attaching an `output` event listener before calling `PhpWeb.run()` and removing it after resolution
2. Provide a `writeFile(path, data)` method that delegates to the Emscripten FS (`phpBinary.FS.writeFile`)
3. Return `{ output: string, headers: string[], exitCode: number }` where `headers` is always an empty array (php-wasm does not expose PHP `header()` calls)

#### Scenario: PHP script is executed and response is returned

- **WHEN** the Service Worker dispatches a request with `backend: php` to the PHP Runtime
- **THEN** the `PhpRuntime` class SHALL set up PHP superglobals (`$_SERVER`, `$_GET`, `$_POST`, `$_COOKIE`), execute the app's PHP file, capture the stdout output via the `output` event, and return it as the response body

#### Scenario: PHP challenge page loads without runtime error

- **WHEN** a user navigates to a PHP challenge page
- **THEN** the runtime SHALL initialize successfully (no "PHP runtime loader not configured" error) and `runtimeReady` SHALL become `true` after `PhpWeb` binary loads

---
### Requirement: Virtual FS entries are mounted into php-wasm before execution

Before executing the PHP script, the PHP Runtime SHALL write all decrypted FS entries (from `wasm-fs`) into php-wasm's virtual filesystem. Each entry SHALL be accessible at its defined virtual path.

#### Scenario: /flag.txt is accessible from PHP

- **WHEN** a challenge defines `fs: { /flag.txt: ./flag.txt }` and the PHP script reads `file_get_contents('/flag.txt')`
- **THEN** the PHP code SHALL receive the decrypted flag content

---
### Requirement: PHP Runtime is initialized once per challenge session

The PHP Runtime SHALL initialize php-wasm exactly once per challenge session. Subsequent requests SHALL reuse the same php-wasm instance without re-initialization.

#### Scenario: Repeated requests reuse php-wasm instance

- **WHEN** a second HTTP request arrives for the same PHP challenge session
- **THEN** php-wasm SHALL NOT be re-initialized and the cached instance SHALL be used

---
### Requirement: PHP Runtime handles HTTP request method and body

The PHP Runtime SHALL populate PHP superglobals according to the incoming request: `$_GET` from query string, `$_POST` from form-encoded body, `$_SERVER['REQUEST_METHOD']` from HTTP method, and raw request body stored in `$GLOBALS['_RAW_INPUT']`. The raw body SHALL NOT be available via `php://input`.

#### Scenario: POST data is available in $_POST

- **WHEN** a POST request with `Content-Type: application/x-www-form-urlencoded` body arrives
- **THEN** `$_POST` SHALL contain the decoded key-value pairs

#### Scenario: Raw body is accessible via $GLOBALS['_RAW_INPUT']

- **WHEN** a POST request with `Content-Type: application/json` body arrives
- **THEN** `$GLOBALS['_RAW_INPUT']` SHALL contain the raw JSON string

---
### Requirement: PHP runtime module resides in .vitepress/composables

The `PhpRuntime.initialize()` method SHALL accept the following signature: `initialize(appCode: string, fsEntries: Record<string, Uint8Array> = {}): Promise<void>`. The `fsEntries` parameter SHALL be a `Record<string, Uint8Array>` mapping virtual paths to binary content.

#### Scenario: initialize called with fsEntries

- **WHEN** `PhpRuntime.initialize(appCode, { '/flag.txt': flagBytes })` is called
- **THEN** the runtime SHALL write `/flag.txt` into php-wasm's virtual filesystem and execute `appCode`

#### Scenario: initialize called with defaults

- **WHEN** `PhpRuntime.initialize(appCode)` is called without fsEntries
- **THEN** the runtime SHALL use an empty default and execute `appCode` without mounting additional files

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