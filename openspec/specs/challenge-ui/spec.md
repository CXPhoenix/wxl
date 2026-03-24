## ADDED Requirements

### Requirement: ChallengeLayout provides three switchable interaction panels

The `ChallengeLayout.vue` component SHALL render four panels accessible via tab navigation: Browser Panel, Repeater Panel, and Network Panel. All panels that issue HTTP requests SHALL share a single `trackedDispatch` wrapper for issuing requests. The Network Panel SHALL receive the traffic log populated by `trackedDispatch`.

#### Scenario: User switches between panels without losing state

- **WHEN** a user switches from the Browser Panel to the Network Panel and back
- **THEN** each panel SHALL retain its previous input state (URL, method, request body, response history, traffic entries)

#### Scenario: All panels target the same challenge origin

- **WHEN** any panel sends an HTTP request
- **THEN** the request SHALL target `http://challenge-<slug>.localhost` and be intercepted by the Service Worker

#### Scenario: Network tab is available alongside Browser and Repeater

- **WHEN** the challenge page loads
- **THEN** the tab navigation SHALL display three tabs: Browser, Repeater, and Network

#### Scenario: RepeatPanel receives injected request from Network panel

- **WHEN** the Network panel emits a Send to Repeater event
- **THEN** ChallengeLayout SHALL set the injected request content on RepeatPanel and switch the active tab to Repeater


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


<!-- @trace
source: add-network-traffic-panel
updated: 2026-03-22
code:
  - .vitepress/theme/components/NetworkPanel.vue
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/RepeatPanel.vue
tests:
  - tests/unit/components/NetworkPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useTrafficLog.test.ts
  - tests/unit/components/RepeatPanel.test.ts
-->


<!-- @trace
source: restore-terminal-and-code-panels
updated: 2026-03-24
code:
  - .vitepress/theme/components/CodeEditorPanel.vue
  - .vitepress/theme/components/WxlshPanel.vue
  - .vitepress/theme/composables/useChallengePersistence.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/useAttackSession.ts
tests:
  - tests/unit/components/CodeEditorPanel.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/components/WxlshPanel.test.ts
-->

### Requirement: Browser Panel simulates a web browser address bar and viewport

The Browser Panel SHALL provide: a URL input field pre-populated with `http://challenge-<slug>.localhost/`, an HTTP method selector (GET, POST, PUT, DELETE, PATCH), a request body editor (shown for non-GET methods), a "Send" button, and a response viewport that renders HTML responses in a sandboxed iframe with `sandbox="allow-scripts allow-forms"`.

#### Scenario: HTML response is rendered in sandboxed iframe

- **WHEN** the challenge app returns a response with `Content-Type: text/html`
- **THEN** the Browser Panel SHALL render the HTML in a sandboxed iframe

#### Scenario: Non-HTML response is shown as formatted text

- **WHEN** the challenge app returns `Content-Type: application/json`
- **THEN** the Browser Panel SHALL display the JSON as syntax-highlighted text, not rendered HTML


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

### Requirement: Terminal Panel accepts curl and HTTPie-style commands

The Terminal Panel SHALL provide a terminal-style input prompt that accepts: `curl <url> [-X method] [-H header] [-d body]` syntax and `http [METHOD] <url> [header:value] [field=value]` (HTTPie) syntax. It SHALL display responses in a terminal-style output area with scrollback history.

#### Scenario: curl GET command sends request and displays response

- **WHEN** a user types `curl http://challenge-sqli.localhost/users` and presses Enter
- **THEN** the Terminal Panel SHALL send a GET request and display the response headers and body in the output area

#### Scenario: curl POST with data is handled

- **WHEN** a user types `curl -X POST http://challenge-sqli.localhost/login -d "user=admin&pass='"` and presses Enter
- **THEN** the Terminal Panel SHALL send a POST request with the specified body

#### Scenario: Invalid command shows usage hint

- **WHEN** a user types an unrecognized command
- **THEN** the Terminal Panel SHALL display an error message with supported command syntax


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

### Requirement: Repeater Panel provides raw HTTP request editing

The Repeater Panel SHALL provide a text area for editing a raw HTTP/1.1 request (method, path, headers, body). It SHALL provide a "Send" button and display the raw HTTP response (status line, headers, body) in a separate read-only text area. The panel SHALL support saving and loading named request snapshots.

#### Scenario: Raw request is parsed and sent

- **WHEN** a user edits a raw HTTP request in the Repeater Panel and clicks "Send"
- **THEN** the panel SHALL parse the raw text into method, path, headers, and body, then dispatch via `useChallengeHttp`

#### Scenario: Raw response is displayed

- **WHEN** the response is received
- **THEN** the Repeater Panel SHALL display the status line, all response headers, and the raw body in the response text area

#### Scenario: Snapshot can be saved and restored

- **WHEN** a user saves a request snapshot with a name
- **THEN** selecting that snapshot SHALL restore the request text area to the saved content


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

### Requirement: White-box mode displays app source code viewer

When `source_visible: true`, the challenge page SHALL display a read-only source code viewer panel showing the app's source code with syntax highlighting. When `source_visible: false` or omitted, the source viewer SHALL NOT be rendered and no source code SHALL be accessible via the DOM.

#### Scenario: White-box source viewer is shown

- **WHEN** a challenge page loads with `source_visible: true`
- **THEN** the page SHALL render a syntax-highlighted, read-only code block containing the full app source (Python or PHP)

#### Scenario: Black-box source viewer is absent

- **WHEN** a challenge page loads with `source_visible: false` or the field is omitted
- **THEN** no source viewer element SHALL exist in the DOM and no readable app source SHALL be accessible via `document.querySelector` or JavaScript


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

### Requirement: Challenge page displays flag submission form

The challenge page SHALL include a persistent flag submission form below the interaction panels. The form SHALL have a text input and a submit button. On submission, it SHALL call the flag verification function and display a success or failure indicator.

#### Scenario: Correct flag shows success message

- **WHEN** a user submits the correct flag
- **THEN** the UI SHALL display a success indicator and the challenge SHALL be marked as solved

#### Scenario: Incorrect flag shows failure message without revealing answer

- **WHEN** a user submits an incorrect flag
- **THEN** the UI SHALL display a failure indicator with no hint about the correct flag


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

### Requirement: Challenge UI components use UnoCSS utility classes for styling

The Vue components `BrowserPanel.vue`, `TerminalPanel.vue`, `RepeatPanel.vue`, `FlagSubmit.vue`, and `ChallengeLayout.vue` SHALL have their `<style scoped>` blocks replaced with UnoCSS utility classes applied directly in their templates. Components SHALL reference design tokens via UnoCSS shortcuts or utility classes that resolve to `--ch-*` CSS custom properties. A minimal `<style scoped>` block is permitted only for CSS transitions or pseudo-element rules not expressible as UnoCSS utilities.

#### Scenario: Components render without scoped style blocks

- **WHEN** a challenge page loads
- **THEN** the Browser Panel, Terminal Panel, Repeater Panel, Flag Submit, and ChallengeLayout SHALL be correctly styled using only UnoCSS-generated CSS classes (with the exception of any transition or pseudo-element rules)

#### Scenario: Dark mode applies via CSS var change, not class toggle

- **WHEN** the user switches between dark and light mode
- **THEN** all challenge UI components SHALL update their visual appearance through CSS custom property resolution without requiring Vue component re-renders or class changes


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

### Requirement: Challenge UI applies the platform color palette

The challenge UI components SHALL visually reflect the platform's dual-theme palette: Midnight Indigo in dark mode (background `#0f0f23`, accent `#6366f1`) and Enterprise Indigo in light mode (background `#eef2ff`, accent `#4338ca`). The right-column interaction area background SHALL be visually distinct from the left-column description area by using the `--ch-bg-panel` token.

#### Scenario: Dark mode renders Midnight Indigo palette

- **WHEN** the `.dark` class is active
- **THEN** the challenge page background SHALL resolve to `#0f0f23` and interactive elements SHALL use `#6366f1` as the accent color

#### Scenario: Light mode renders Enterprise Indigo palette

- **WHEN** the `.dark` class is absent
- **THEN** the challenge page background SHALL resolve to `#eef2ff` and interactive elements SHALL use `#4338ca` as the accent color

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

### Requirement: ChallengeLayout provides three switchable interaction panels

The `ChallengeLayout.vue` component SHALL render five panels accessible via tab navigation: Browser Panel, Network Panel, Repeater Panel, Terminal Panel (WxlshPanel), and Code Editor Panel (CodeEditorPanel). All panels that issue HTTP requests SHALL use source-attributed dispatch wrappers for issuing requests. The Network Panel SHALL receive the traffic log populated by `trackedDispatch`.

#### Scenario: User switches between panels without losing state

- **WHEN** a user switches from the Browser Panel to the Terminal Panel and back
- **THEN** each panel SHALL retain its previous input state (URL, method, request body, response history, traffic entries, terminal history, editor content)

#### Scenario: All panels target the same challenge origin

- **WHEN** any panel sends an HTTP request
- **THEN** the request SHALL target `http://challenge-<slug>.localhost` and be intercepted by the Service Worker

#### Scenario: All five tabs are visible in the tab navigation

- **WHEN** the challenge page loads
- **THEN** the tab navigation SHALL display five tabs: Browser, Network, Repeater, Terminal, and Code

#### Scenario: RepeatPanel receives injected request from Network panel

- **WHEN** the Network panel emits a Send to Repeater event
- **THEN** ChallengeLayout SHALL set the injected request content on RepeatPanel and switch the active tab to Repeater

---
### Requirement: Browser Panel simulates a web browser address bar and viewport

The Browser Panel SHALL provide: a URL input field pre-populated with `https://challenge-<slug>.localhost/` and a "Go" button. The HTTP method selector SHALL NOT be present. Pressing Enter in the URL field SHALL trigger a GET fetch identical to clicking the "Go" button. The iframe SHALL use `sandbox="allow-scripts allow-forms allow-same-origin"`. Link clicks within the iframe SHALL be intercepted, the URL bar SHALL be updated to the link's href, and a new GET fetch SHALL be dispatched automatically.

#### Scenario: Enter key in URL bar triggers navigation

- **WHEN** the user types a URL in the address bar and presses Enter
- **THEN** the Browser Panel SHALL dispatch a GET request to that URL and render the response

#### Scenario: Link click in iframe triggers in-panel navigation

- **WHEN** the user clicks a link inside the rendered HTML iframe
- **THEN** the Browser Panel SHALL intercept the click, update the URL bar to the link's href, and dispatch a new GET request without leaving the page

#### Scenario: HTML response is rendered in sandboxed iframe

- **WHEN** the challenge app returns a response with `Content-Type: text/html`
- **THEN** the Browser Panel SHALL render the HTML in the sandboxed iframe

#### Scenario: Non-HTML response is shown as formatted text

- **WHEN** the challenge app returns `Content-Type: application/json`
- **THEN** the Browser Panel SHALL display the JSON as formatted text, not rendered HTML

---
### Requirement: Browser Panel intercepts HTML form submissions inside the iframe

The Browser Panel SHALL attach a `submit` event listener to the iframe's `contentDocument` (alongside the existing `click` listener for anchor tags). When a form is submitted inside the iframe, the panel SHALL:
1. Call `preventDefault()` to suppress the native browser form navigation
2. Resolve the form's `action` attribute (or the current URL if absent) against the challenge base URL `https://challenge-<slug>.localhost/`
3. Read the form's `method` attribute (defaulting to `GET` if absent)
4. Serialize the form fields according to the form's `enctype`:
   - `application/x-www-form-urlencoded` (default): use `URLSearchParams` as the request body with `Content-Type: application/x-www-form-urlencoded`
   - `multipart/form-data`: use `FormData` as the request body without manually setting `Content-Type` (the browser SHALL generate the boundary automatically)
   - GET method: append fields as a query string to the resolved URL; no request body
5. Call `dispatch(new Request(resolvedUrl, { method, headers, body }))` and pass the response to `handleResponse()`

#### Scenario: POST form with default enctype is submitted

- **WHEN** the user submits an HTML form with `method="POST"` and no explicit `enctype` inside the iframe
- **THEN** the Browser Panel SHALL call `dispatch()` with a POST request whose `Content-Type` is `application/x-www-form-urlencoded` and whose body contains the serialized form fields

#### Scenario: POST form with multipart/form-data enctype is submitted

- **WHEN** the user submits an HTML form with `enctype="multipart/form-data"` inside the iframe
- **THEN** the Browser Panel SHALL call `dispatch()` with a POST request whose body is a `FormData` object (allowing the browser to set the `Content-Type` boundary automatically)

#### Scenario: GET form appends fields to query string

- **WHEN** the user submits an HTML form with `method="GET"` inside the iframe
- **THEN** the Browser Panel SHALL resolve the action URL, append all form fields as a query string, and call `dispatch()` with a GET request (no body)

#### Scenario: Form action relative URL resolves to challenge origin

- **WHEN** a form has `action="/login"` and the current challenge slug is `sqli-demo`
- **THEN** the resolved URL SHALL be `https://challenge-sqli-demo.localhost/login`, not `http://localhost:5173/login`

#### Scenario: Form with no action attribute submits to current URL

- **WHEN** a form has no `action` attribute
- **THEN** the Browser Panel SHALL use the current value of the URL bar (`url.value`) as the submission target


<!-- @trace
source: fix-browser-form-submit
updated: 2026-03-16
code:
  - .vitepress/theme/composables/usePythonRuntime.ts
  - .vitepress/theme/components/BrowserPanel.vue
  - .vitepress/theme/components/WxlshPanel.vue
  - .vitepress/theme/components/CodeEditorPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/components/CodeEditorPanel.test.ts
-->

---
### Requirement: Terminal Panel accepts curl and HTTPie-style commands

The Terminal Panel SHALL be implemented as `WxlshPanel.vue` using xterm.js as the display layer and the `wxlsh` command dispatcher. It SHALL display the brand name "wxlsh" (not "bash") and a startup banner on first render. The previous `<div>`-based terminal UI and TypeScript CLI parser SHALL be removed. All terminal functionality SHALL be provided by `WxlshPanel` as specified in the `wxlsh-terminal` capability spec.

#### Scenario: Terminal tab renders xterm.js terminal

- **WHEN** the user clicks the "Terminal" tab
- **THEN** the panel SHALL render an xterm.js canvas with the wxlsh banner

#### Scenario: curl command sends HTTP request via dispatch

- **WHEN** the user types `curl https://challenge-sqli.localhost/users` and presses Enter
- **THEN** the Terminal Panel SHALL send a GET request and display the response headers and body in the terminal output

#### Scenario: Invalid command shows usage hint

- **WHEN** a user types an unrecognized command
- **THEN** the Terminal Panel SHALL display "wxlsh: <command>: command not found" and suggest using `help`

---
### Requirement: Repeater Panel provides raw HTTP request editing

The Repeater Panel SHALL retain its core functionality (raw HTTP/1.1 request editing, send, response display, named snapshots). The visual presentation SHALL be upgraded: snapshot list SHALL be displayed as a named sidebar list rather than bottom inline chips, the "Save" button SHALL prompt the user for a snapshot name, and the textarea and response area SHALL use consistent monospace typography with improved line-height and border treatment.

#### Scenario: Raw request is parsed and sent

- **WHEN** a user edits a raw HTTP request in the Repeater Panel and clicks "Send"
- **THEN** the panel SHALL parse the raw text into method, path, headers, and body, then dispatch via `dispatch`

#### Scenario: Raw response is displayed

- **WHEN** the response is received
- **THEN** the Repeater Panel SHALL display the status line, all response headers, and the raw body

#### Scenario: Named snapshot can be saved and restored

- **WHEN** a user clicks "Save", enters a name, and confirms
- **THEN** the snapshot SHALL appear in the sidebar list and selecting it SHALL restore the request content

---
### Requirement: White-box mode displays app source code viewer

When `source_visible: true`, the challenge page SHALL display a read-only source code viewer panel showing the app's source code with syntax highlighting. When `source_visible: false` or omitted, the source viewer SHALL NOT be rendered and no source code SHALL be accessible via the DOM.

#### Scenario: White-box source viewer is shown

- **WHEN** a challenge page loads with `source_visible: true`
- **THEN** the page SHALL render a syntax-highlighted, read-only code block containing the full app source (Python or PHP)

#### Scenario: Black-box source viewer is absent

- **WHEN** a challenge page loads with `source_visible: false` or the field is omitted
- **THEN** no source viewer element SHALL exist in the DOM and no readable app source SHALL be accessible via `document.querySelector` or JavaScript

---
### Requirement: Challenge page displays flag submission form

The challenge page SHALL include a persistent flag submission form below the interaction panels. The form SHALL have a text input and a submit button. On submission, it SHALL call the flag verification function and display a success or failure indicator.

When the flag is correct, the success state SHALL additionally display a "下載攻擊紀錄" (Download Attack Log) button. Clicking this button SHALL invoke an `onExport` callback prop provided by the parent layout, which triggers the JSON file download of the current attack session.

`FlagSubmit.vue` SHALL accept an optional `onExportNotes?: () => void` prop alongside the existing `onExport` prop. When `onExportNotes` is provided and the challenge is in the `success` state, a `下載滲透筆記` button SHALL be rendered after the existing `下載攻擊紀錄` button. Clicking the `下載滲透筆記` button SHALL invoke `onExportNotes()`.

#### Scenario: Correct flag shows success message and export button

- **WHEN** a user submits the correct flag
- **THEN** the UI SHALL display a success indicator
- **AND** a "下載攻擊紀錄" button SHALL appear in the success state

#### Scenario: Export button triggers attack session download

- **WHEN** a user clicks "下載攻擊紀錄" after solving the challenge
- **THEN** the `onExport` prop callback SHALL be invoked
- **AND** the browser SHALL initiate a JSON file download of the attack session

#### Scenario: Notes download button appears after solving when prop is provided

- **WHEN** the challenge is solved and `onExportNotes` prop is set
- **THEN** the `下載滲透筆記` button SHALL be visible in the success state UI

#### Scenario: Notes download button is absent when prop is not provided

- **WHEN** `onExportNotes` is `undefined`
- **THEN** no notes download button SHALL be rendered

#### Scenario: Clicking the notes download button invokes the callback

- **WHEN** the user clicks `下載滲透筆記`
- **THEN** `onExportNotes()` SHALL be called, triggering `pentestNotes.downloadMarkdown(title, slug)` in `ChallengeLayout`

#### Scenario: Incorrect flag shows failure message without revealing answer

- **WHEN** a user submits an incorrect flag
- **THEN** the UI SHALL display a failure indicator with no hint about the correct flag
- **AND** no export button SHALL be displayed

---
### Requirement: BrowserPanel sends realistic browser-like HTTP requests

Every request dispatched from `BrowserPanel.vue` SHALL include a complete set of simulated browser headers for display in the Network Traffic panel. `BrowserPanel` SHALL attach request-context metadata via `X-Wxlsh-Context` and `X-Wxlsh-Referer` headers; `useTrafficLog.wrap()` SHALL consume these metadata headers (stripping them before dispatch to the runtime), then synthesize the full simulated header set — including static browser identity headers and context-specific dynamic headers — for the recorded `TrafficEntry`. The synthesized headers SHALL follow HTTP/1.1 Title-Case convention and Chrome's conventional header ordering (Host first, Connection second, Accept-Encoding and Accept-Language last).

#### Scenario: Address bar navigation includes full browser headers

- **WHEN** a user navigates to a URL via the BrowserPanel address bar
- **THEN** the dispatched request SHALL include `User-Agent`, `Accept`, `Accept-Language`, `Accept-Encoding`, `Connection`, `Host`, `Sec-Ch-Ua`, `Sec-Ch-Ua-Mobile`, `Sec-Ch-Ua-Platform`, `Upgrade-Insecure-Requests`, `Sec-Fetch-Dest: document`, `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Site: none`, and `Sec-Fetch-User: ?1`

#### Scenario: Link click includes Referer and same-origin Sec-Fetch headers

- **WHEN** a user clicks a link inside the BrowserPanel iframe
- **THEN** the dispatched request SHALL include all static browser headers plus `Referer` set to the current page URL, `Sec-Fetch-Dest: document`, `Sec-Fetch-Mode: navigate`, and `Sec-Fetch-Site: same-origin`

#### Scenario: Form GET submission includes Referer and navigation headers

- **WHEN** a user submits a GET form inside the BrowserPanel iframe
- **THEN** the dispatched request SHALL include all static browser headers plus `Referer` set to the form page URL, `Sec-Fetch-Dest: document`, `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Site: same-origin`, and `Sec-Fetch-User: ?1`

#### Scenario: Form POST submission includes Origin, Referer, and Content-Length

- **WHEN** a user submits a POST form with `application/x-www-form-urlencoded` encoding inside the BrowserPanel iframe
- **THEN** the dispatched request SHALL include all static browser headers plus `Origin` set to the challenge origin, `Referer` set to the form page URL, `Content-Type: application/x-www-form-urlencoded`, `Content-Length` reflecting the byte length of the encoded body, `Sec-Fetch-Site: same-origin`, and `Sec-Fetch-User: ?1`

#### Scenario: NetworkPanel records complete headers from BrowserPanel requests

- **WHEN** BrowserPanel dispatches any request through `trackedDispatch`
- **THEN** the NetworkPanel traffic log SHALL display a header list matching the full set of browser-simulated headers defined by `buildBrowserRequest()`

<!-- @trace
source: simulate-browser-request-headers
updated: 2026-03-23
code:
  - .vitepress/theme/composables/useTrafficLog.ts
  - .vitepress/theme/components/NetworkPanel.vue
  - .vitepress/theme/components/BrowserPanel.vue
tests:
  - tests/unit/components/BrowserPanel.test.ts
  - tests/unit/composables/useTrafficLog.test.ts
-->

---
### Requirement: ChallengeLayout renders a NotesButton in the header

`ChallengeLayout.vue` SHALL render a `NotesButton` component in the right side of the challenge header, positioned to be visually symmetric with the `← Challenges` back link on the left. The button SHALL be absolutely positioned within the header's flex container.

The `NotesButton` SHALL receive `noteCount` from `pentestNotes.noteCount`. Clicking the button SHALL set `notesModalVisible.value = true`.

#### Scenario: NotesButton is visible on challenge page load

- **WHEN** a user opens a challenge page
- **THEN** the `NotesButton` SHALL be visible in the header area to the right of the challenge title

#### Scenario: Clicking NotesButton opens the modal

- **WHEN** the user clicks the `NotesButton`
- **THEN** `notesModalVisible` SHALL be set to `true` and the `NotesModal` SHALL become visible


<!-- @trace
source: add-pentest-notes
updated: 2026-03-24
code:
  - .vitepress/theme/composables/usePentestNotes.ts
  - package.json
  - .vitepress/theme/composables/useChallengePersistence.ts
  - uno.config.ts
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/NotesModal.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - .vitepress/theme/components/NotesButton.vue
  - .vitepress/theme/components/NoteCard.vue
  - .vitepress/theme/components/NoteEditor.vue
tests:
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/usePentestNotes.test.ts
-->

---
### Requirement: ChallengeLayout integrates usePentestNotes and NotesModal

`ChallengeLayout.vue` SHALL instantiate `usePentestNotes(attackSession, slug)` and call `pentestNotes.init(slug.value)` after `attackSession.init()` during `onMounted`. It SHALL render `<NotesModal>` (conditionally with `v-if="notesModalVisible"`) just before the root closing `</div>`. The modal SHALL receive `pentestNotes` as a prop and emit a `close` event that sets `notesModalVisible.value = false`.

#### Scenario: Pentest notes are initialized with attack session

- **WHEN** the challenge page mounts
- **THEN** `pentestNotes.init(slug)` SHALL be called after `attackSession.init()` so notes are loaded from IndexedDB before the modal is first opened

#### Scenario: NotesModal is not rendered when closed

- **WHEN** `notesModalVisible` is `false`
- **THEN** the `NotesModal` component SHALL NOT be present in the DOM


<!-- @trace
source: add-pentest-notes
updated: 2026-03-24
code:
  - .vitepress/theme/composables/usePentestNotes.ts
  - package.json
  - .vitepress/theme/composables/useChallengePersistence.ts
  - uno.config.ts
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/NotesModal.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - .vitepress/theme/components/NotesButton.vue
  - .vitepress/theme/components/NoteCard.vue
  - .vitepress/theme/components/NoteEditor.vue
tests:
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/usePentestNotes.test.ts
-->

---
### Requirement: ChallengeLayout threads executionId through code execution dispatch

`ChallengeLayout.vue` SHALL maintain a module-level variable `let currentExecutionId: string | null = null`. Before invoking the code execution callback (`onCodeExecuted`), it SHALL generate `currentExecutionId = crypto.randomUUID()`. After the execution completes, it SHALL reset `currentExecutionId = null`.

The `makeSourceDispatch('code')` function SHALL read `currentExecutionId` and pass it as the `executionId` parameter when calling `attackSession.addHttpEvent(entry, 'code', currentExecutionId)`.

#### Scenario: HTTP requests made during code execution share the executionId

- **WHEN** Python code executes and makes an HTTP request via the `requests` stub
- **THEN** both the `code_execution` event and all `http_request` events generated during that execution SHALL share the same non-null `executionId`

#### Scenario: HTTP requests outside code execution have no executionId

- **WHEN** an HTTP request is made from the Browser panel, Repeater panel, or terminal (not from code execution)
- **THEN** the resulting `http_request` event SHALL have no `executionId` field


<!-- @trace
source: add-pentest-notes
updated: 2026-03-24
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/NotesButton.vue
  - .vitepress/theme/components/NotesModal.vue
  - .vitepress/theme/components/FlagSubmit.vue
tests:
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/components/NotesButton.test.ts
  - tests/unit/components/NotesModal.test.ts
  - tests/unit/components/FlagSubmit.test.ts
-->


<!-- @trace
source: add-pentest-notes
updated: 2026-03-24
code:
  - .vitepress/theme/composables/usePentestNotes.ts
  - package.json
  - .vitepress/theme/composables/useChallengePersistence.ts
  - uno.config.ts
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/NotesModal.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - .vitepress/theme/components/NotesButton.vue
  - .vitepress/theme/components/NoteCard.vue
  - .vitepress/theme/components/NoteEditor.vue
tests:
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/usePentestNotes.test.ts
-->

---
### Requirement: FlagSubmit supports a notes export download action

`FlagSubmit.vue` SHALL accept an optional `onExportNotes?: () => void` prop alongside the existing `onExport` prop. When `onExportNotes` is provided and the challenge is in the `success` state, a `下載滲透筆記` button SHALL be rendered after the existing `下載攻擊紀錄` button. Clicking the `下載滲透筆記` button SHALL invoke `onExportNotes()`.

#### Scenario: Notes download button appears after solving when prop is provided

- **WHEN** the challenge is solved and `onExportNotes` prop is set
- **THEN** the `下載滲透筆記` button SHALL be visible in the success state UI

#### Scenario: Notes download button is absent when prop is not provided

- **WHEN** `onExportNotes` is `undefined`
- **THEN** no notes download button SHALL be rendered

#### Scenario: Clicking the notes download button invokes the callback

- **WHEN** the user clicks `下載滲透筆記`
- **THEN** `onExportNotes()` SHALL be called, triggering `pentestNotes.downloadMarkdown(title, slug)` in `ChallengeLayout`

<!-- @trace
source: add-pentest-notes
updated: 2026-03-24
code:
  - .vitepress/theme/composables/usePentestNotes.ts
  - package.json
  - .vitepress/theme/composables/useChallengePersistence.ts
  - uno.config.ts
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/NotesModal.vue
  - .vitepress/theme/components/FlagSubmit.vue
  - .vitepress/theme/components/NotesButton.vue
  - .vitepress/theme/components/NoteCard.vue
  - .vitepress/theme/components/NoteEditor.vue
tests:
  - tests/unit/composables/useAttackSession.test.ts
  - tests/unit/composables/useChallengePersistence.test.ts
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/usePentestNotes.test.ts
-->