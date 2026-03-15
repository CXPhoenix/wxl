# challenge-list Specification

## Purpose

TBD - created by archiving change 'vitepress-platform-refactor'. Update Purpose after archive.

## Requirements

### Requirement: Challenge list page collects all challenge frontmatter at build time using createContentLoader

A VitePress data loader file (`docs/challenges/challenges.data.ts`) SHALL use `createContentLoader('challenges/*.md', { excerpt: true })` to collect frontmatter from all challenge `.md` files at build time. The exported data SHALL be typed and include at minimum: `title`, `difficulty`, `category`, and the URL of each challenge page.

#### Scenario: Data loader exports typed challenge entries

- **WHEN** VitePress builds the site
- **THEN** `challenges.data.ts` SHALL export a `ChallengeData[]` array with one entry per `docs/challenges/*.md` file, each containing `title`, `url`, `difficulty`, and `category` fields

#### Scenario: Adding a new challenge file auto-includes it in the list

- **WHEN** a new `.md` file is added to `docs/challenges/`
- **THEN** the next build SHALL include the new challenge in the list without any manual configuration change


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
### Requirement: Challenge list page uses a globally registered Vue component embedded in markdown

The challenge list display logic SHALL be implemented as a Vue component (`theme/components/ChallengeList.vue`) globally registered in `enhanceApp` via `app.component('ChallengeList', ChallengeList)`. The `docs/challenges/index.md` page SHALL use the VitePress default layout and embed `<ChallengeList />` directly in the markdown body. The `challenge-list` layout registration in `theme/index.ts` SHALL be removed, and `ChallengeListLayout.vue` SHALL be deleted.

#### Scenario: Challenge list page renders without layout frontmatter

- **WHEN** the user navigates to `/challenges/`
- **THEN** VitePress SHALL apply the default layout and the `<ChallengeList />` component SHALL render all available challenges

#### Scenario: ChallengeList can be embedded in any markdown page

- **WHEN** any `.md` file includes `<ChallengeList />` in its body
- **THEN** the component SHALL render the full challenge list without requiring `layout: challenge-list` in frontmatter


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

---
### Requirement: Challenge list displays each challenge as a card with metadata and a link

The challenge list layout SHALL render each challenge as a card showing: the challenge title, difficulty badge, category badge, and a link to the challenge page. Clicking the card or its title SHALL navigate to the individual challenge page.

#### Scenario: Challenge card displays correct metadata

- **WHEN** the list page renders a challenge with `title: "SQL Injection 入門"`, `difficulty: "beginner"`, `category: "SQLi"`
- **THEN** the card SHALL display those exact values and a link to the challenge URL

#### Scenario: Clicking a challenge card navigates to the challenge

- **WHEN** the user clicks a challenge card
- **THEN** the browser SHALL navigate to the corresponding challenge page

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