## ADDED Requirements

### Requirement: ChallengeLayout provides three switchable interaction panels

The `ChallengeLayout.vue` component SHALL render three panels accessible via tab navigation: Browser Panel, Terminal Panel, and Repeater Panel. All three panels SHALL share a single `useChallengeHttp` composable for issuing requests.

#### Scenario: User switches between panels without losing state

- **WHEN** a user switches from the Browser Panel to the Terminal Panel and back
- **THEN** each panel SHALL retain its previous input state (URL, method, request body, response history)

#### Scenario: All panels target the same challenge origin

- **WHEN** any panel sends an HTTP request
- **THEN** the request SHALL target `http://challenge-<slug>.localhost` and be intercepted by the Service Worker


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

---

### Requirement: Challenge UI components use UnoCSS utility classes for styling

The Vue components `BrowserPanel.vue`, `TerminalPanel.vue`, `RepeatPanel.vue`, `FlagSubmit.vue`, and `ChallengeLayout.vue` SHALL have their `<style scoped>` blocks replaced with UnoCSS utility classes applied directly in their templates. Components SHALL reference design tokens via UnoCSS shortcuts or utility classes that resolve to `--ch-*` CSS custom properties. A minimal `<style scoped>` block is permitted only for CSS transitions or pseudo-element rules not expressible as UnoCSS utilities.

#### Scenario: Components render without scoped style blocks

- **WHEN** a challenge page loads
- **THEN** the Browser Panel, Terminal Panel, Repeater Panel, Flag Submit, and ChallengeLayout SHALL be correctly styled using only UnoCSS-generated CSS classes (with the exception of any transition or pseudo-element rules)

#### Scenario: Dark mode applies via CSS var change, not class toggle

- **WHEN** the user switches between dark and light mode
- **THEN** all challenge UI components SHALL update their visual appearance through CSS custom property resolution without requiring Vue component re-renders or class changes

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

### Requirement: ChallengeLayout provides three switchable interaction panels

The `ChallengeLayout.vue` component SHALL be implemented as a VitePress custom layout (registered under the name `challenge` in `theme/index.ts`) rather than an embeddable Vue component used inside `.md` files. It SHALL render three panels accessible via tab navigation: Browser Panel, Terminal Panel, and Repeater Panel. All three panels SHALL share a single `useChallengeHttp` composable for issuing requests. The layout SHALL receive the challenge `slug` from the page's frontmatter via VitePress's `useData()` composable rather than as a component prop.

#### Scenario: User switches between panels without losing state

- **WHEN** a user switches from the Browser Panel to the Terminal Panel and back
- **THEN** each panel SHALL retain its previous input state (URL, method, request body, response history)

#### Scenario: All panels target the same challenge origin

- **WHEN** any panel sends an HTTP request
- **THEN** the request SHALL target `http://challenge-<slug>.localhost` and be intercepted by the Service Worker

#### Scenario: Layout is activated via frontmatter, not component embedding

- **WHEN** a challenge `.md` file declares `layout: challenge` in its frontmatter
- **THEN** VitePress SHALL render the `ChallengeLayout.vue` layout without any `<ChallengeLayout>` or `<ChallengeUI>` tag appearing in the `.md` content body

---
### Requirement: Browser Panel simulates a web browser address bar and viewport

The Browser Panel SHALL provide: a URL input field pre-populated with `http://challenge-<slug>.localhost/`, an HTTP method selector (GET, POST, PUT, DELETE, PATCH), a request body editor (shown for non-GET methods), a "Send" button, and a response viewport that renders HTML responses in a sandboxed iframe with `sandbox="allow-scripts allow-forms"`.

#### Scenario: HTML response is rendered in sandboxed iframe

- **WHEN** the challenge app returns a response with `Content-Type: text/html`
- **THEN** the Browser Panel SHALL render the HTML in a sandboxed iframe

#### Scenario: Non-HTML response is shown as formatted text

- **WHEN** the challenge app returns `Content-Type: application/json`
- **THEN** the Browser Panel SHALL display the JSON as syntax-highlighted text, not rendered HTML

---
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

---
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

#### Scenario: Correct flag shows success message

- **WHEN** a user submits the correct flag
- **THEN** the UI SHALL display a success indicator and the challenge SHALL be marked as solved

#### Scenario: Incorrect flag shows failure message without revealing answer

- **WHEN** a user submits an incorrect flag
- **THEN** the UI SHALL display a failure indicator with no hint about the correct flag