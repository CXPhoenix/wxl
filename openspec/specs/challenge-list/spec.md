# challenge-list Specification

## Purpose

TBD - created by archiving change 'vitepress-platform-refactor'. Update Purpose after archive.

## Requirements

### Requirement: Challenge list page collects all challenge frontmatter at build time using createContentLoader

The challenges data loader (`docs/shared/challenges.data.ts`) SHALL export `ChallengeData[]`. The `ChallengeData.difficulty` field SHALL be typed as `'easy' | 'medium' | 'hard' | 'mystery'` (a closed union without `| string`) to ensure compile-time type safety for difficulty values.

#### Scenario: Difficulty field rejects arbitrary string values at compile time

- **WHEN** a developer assigns an arbitrary string (e.g., `"unknown"`) to `ChallengeData.difficulty`
- **THEN** the TypeScript compiler SHALL report a type error

#### Scenario: Valid difficulty values are accepted

- **WHEN** a developer assigns `'easy'`, `'medium'`, `'hard'`, or `'mystery'` to `ChallengeData.difficulty`
- **THEN** the TypeScript compiler SHALL accept the assignment without error


<!-- @trace
source: fix-project-config
updated: 2026-03-25
code:
  - package.json
  - .vitepress/theme/index.ts
  - .github/workflows/release.yml
  - docs/shared/challenges.data.ts
  - tsconfig.json
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

The challenge list layout SHALL render each challenge as a card showing: the challenge `id` as a zero-padded three-digit number (e.g., `#001`), the challenge title, a difficulty badge with semantic color coding, a category badge, a description excerpt (limited to 2-3 lines via CSS line-clamp), tag pills for each tag, a formatted date, and a link to the challenge page. Clicking the card SHALL navigate to the individual challenge page. Difficulty badges SHALL use the following semantic colors: `easy` = green tones, `medium` = yellow/amber tones, `hard` = red tones, `mystery` = purple tones. The card SHALL display a top-edge accent line using the `--ch-accent` color on hover.

#### Scenario: Challenge card displays full metadata including description, tags, and date

- **WHEN** the list page renders a challenge with `id: 1`, `title: "SQL Injection"`, `difficulty: "easy"`, `category: "web"`, `description: "Learn SQL injection..."`, `tags: ["sql", "injection"]`, `date: "2025-03-01T10:30:00.000Z"`
- **THEN** the card SHALL display `#001`, the title, a green-toned easy badge, a web category badge, the description clamped to 2-3 lines, tag pills for each tag, and a formatted date

#### Scenario: Difficulty badge uses semantic color coding

- **WHEN** a challenge has `difficulty: "hard"`
- **THEN** its badge SHALL use red tones (dark: red-transparent bg, red fg; light: red-light bg, dark-red fg)

#### Scenario: Card hover shows accent top-edge line

- **WHEN** the user hovers over a challenge card
- **THEN** a top-edge line using the `--ch-accent` color SHALL become visible and the card border SHALL change to `--ch-border-hover`

#### Scenario: Clicking a challenge card navigates to the challenge

- **WHEN** the user clicks a challenge card
- **THEN** the browser SHALL navigate to the corresponding challenge page


<!-- @trace
source: challenge-list-redesign
updated: 2026-03-25
code:
  - docs/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/terminal.svg
  - .vitepress/theme/Layout.vue
  - .vitepress/challenge/config.ts
  - .vitepress/config.mts
  - docs/challenge/fastapi-demo.md
  - docs/challenge/sqli-demo.md
  - uno.config.ts
  - docs/public/icons/code.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/index.ts
  - docs/public/icons/network.svg
  - docs/guide/python.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - docs/guide/network.md
  - docs/public/icons/notes.svg
  - docs/challenge/php-demo.md
  - docs/guide/terminal.md
  - scripts/create-challenge.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: Challenge list provides debounced text search across title, description, and tags

The `ChallengeList` component SHALL include a text search input field. The search SHALL filter challenges by matching the query string against `title`, `description`, and `tags` fields (case-insensitive). The search input SHALL be debounced with a 300ms delay using an inline implementation (`setTimeout` / `clearTimeout`), without depending on `@vueuse/core`.

#### Scenario: Search filters challenges by title

- **WHEN** the user types "SQL" in the search input
- **THEN** after 300ms debounce, only challenges whose title, description, or tags contain "SQL" (case-insensitive) SHALL be displayed

#### Scenario: Search input is debounced at 300ms

- **WHEN** the user types rapidly in the search input
- **THEN** the filter SHALL only execute 300ms after the last keystroke, not on every keystroke

#### Scenario: Clearing the search input shows all challenges

- **WHEN** the user clears the search input
- **THEN** all challenges (subject to other active filters) SHALL be displayed


<!-- @trace
source: challenge-list-redesign
updated: 2026-03-25
code:
  - docs/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/terminal.svg
  - .vitepress/theme/Layout.vue
  - .vitepress/challenge/config.ts
  - .vitepress/config.mts
  - docs/challenge/fastapi-demo.md
  - docs/challenge/sqli-demo.md
  - uno.config.ts
  - docs/public/icons/code.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/index.ts
  - docs/public/icons/network.svg
  - docs/guide/python.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - docs/guide/network.md
  - docs/public/icons/notes.svg
  - docs/challenge/php-demo.md
  - docs/guide/terminal.md
  - scripts/create-challenge.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: Challenge list provides difficulty and category dropdown filters

The `ChallengeList` component SHALL include a difficulty dropdown filter with options: all (default), easy, medium, hard, mystery. The component SHALL also include a category dropdown filter whose options are dynamically generated from the unique `category` values present in the challenge data. Selecting "all" in either filter SHALL show all challenges for that dimension.

#### Scenario: Filtering by difficulty

- **WHEN** the user selects "hard" from the difficulty dropdown
- **THEN** only challenges with `difficulty: "hard"` SHALL be displayed

#### Scenario: Category dropdown options are dynamically generated

- **WHEN** the challenge data contains categories "web" and "crypto"
- **THEN** the category dropdown SHALL include options: all, web, crypto

#### Scenario: Combining difficulty and category filters

- **WHEN** the user selects difficulty "easy" and category "web"
- **THEN** only challenges matching both `difficulty: "easy"` AND `category: "web"` SHALL be displayed


<!-- @trace
source: challenge-list-redesign
updated: 2026-03-25
code:
  - docs/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/terminal.svg
  - .vitepress/theme/Layout.vue
  - .vitepress/challenge/config.ts
  - .vitepress/config.mts
  - docs/challenge/fastapi-demo.md
  - docs/challenge/sqli-demo.md
  - uno.config.ts
  - docs/public/icons/code.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/index.ts
  - docs/public/icons/network.svg
  - docs/guide/python.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - docs/guide/network.md
  - docs/public/icons/notes.svg
  - docs/challenge/php-demo.md
  - docs/guide/terminal.md
  - scripts/create-challenge.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: Challenge list provides sort controls with direction toggle

The `ChallengeList` component SHALL include sort controls allowing the user to sort by: ID, difficulty, category, or date. A direction toggle button SHALL switch between ascending and descending order. Difficulty sorting SHALL use the fixed order `['easy', 'medium', 'hard', 'mystery']`, not alphabetical order. The default sort SHALL be by ID ascending.

#### Scenario: Sorting by difficulty uses fixed order

- **WHEN** the user selects sort by "difficulty" in ascending order
- **THEN** challenges SHALL be ordered: easy, medium, hard, mystery

#### Scenario: Toggling sort direction

- **WHEN** the user clicks the direction toggle while sorting by date ascending
- **THEN** the sort direction SHALL change to descending (newest first)

#### Scenario: Default sort is by ID ascending

- **WHEN** the challenge list first renders
- **THEN** challenges SHALL be sorted by ID in ascending order


<!-- @trace
source: challenge-list-redesign
updated: 2026-03-25
code:
  - docs/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/terminal.svg
  - .vitepress/theme/Layout.vue
  - .vitepress/challenge/config.ts
  - .vitepress/config.mts
  - docs/challenge/fastapi-demo.md
  - docs/challenge/sqli-demo.md
  - uno.config.ts
  - docs/public/icons/code.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/index.ts
  - docs/public/icons/network.svg
  - docs/guide/python.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - docs/guide/network.md
  - docs/public/icons/notes.svg
  - docs/challenge/php-demo.md
  - docs/guide/terminal.md
  - scripts/create-challenge.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: Challenge list supports grid and list view modes

The `ChallengeList` component SHALL provide a view mode toggle between grid view and list view. Grid view SHALL render rich cards with ID, title, badges, description (2-3 line clamp), tags, and date. List view SHALL render compact table rows with ID, title, difficulty, category, and date. The view mode toggle buttons SHALL use the `ch-view-btn` and `ch-view-btn-active` UnoCSS shortcuts.

#### Scenario: Grid view displays rich cards

- **WHEN** the user selects grid view (default)
- **THEN** each challenge SHALL be rendered as a card with ID, title, difficulty badge, category badge, description excerpt, tag pills, and date

#### Scenario: List view displays compact rows

- **WHEN** the user selects list view
- **THEN** each challenge SHALL be rendered as a compact table row showing ID, title, difficulty, category, and date

#### Scenario: View mode persists during filtering

- **WHEN** the user switches to list view and then applies a search filter
- **THEN** the filtered results SHALL continue to render in list view


<!-- @trace
source: challenge-list-redesign
updated: 2026-03-25
code:
  - docs/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/terminal.svg
  - .vitepress/theme/Layout.vue
  - .vitepress/challenge/config.ts
  - .vitepress/config.mts
  - docs/challenge/fastapi-demo.md
  - docs/challenge/sqli-demo.md
  - uno.config.ts
  - docs/public/icons/code.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/index.ts
  - docs/public/icons/network.svg
  - docs/guide/python.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - docs/guide/network.md
  - docs/public/icons/notes.svg
  - docs/challenge/php-demo.md
  - docs/guide/terminal.md
  - scripts/create-challenge.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: Challenge list displays empty state when no challenges match filters

The `ChallengeList` component SHALL display a user-friendly empty state message when the combination of active search query, difficulty filter, and category filter produces zero matching challenges.

#### Scenario: Empty state message appears when no results match

- **WHEN** the user searches for "nonexistent" and no challenges match
- **THEN** the component SHALL display an empty state message instead of an empty grid/list

#### Scenario: Empty state disappears when filters are relaxed

- **WHEN** the user clears the search query that caused an empty state
- **THEN** the matching challenges SHALL be displayed again and the empty state message SHALL be hidden


<!-- @trace
source: challenge-list-redesign
updated: 2026-03-25
code:
  - docs/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/terminal.svg
  - .vitepress/theme/Layout.vue
  - .vitepress/challenge/config.ts
  - .vitepress/config.mts
  - docs/challenge/fastapi-demo.md
  - docs/challenge/sqli-demo.md
  - uno.config.ts
  - docs/public/icons/code.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/index.ts
  - docs/public/icons/network.svg
  - docs/guide/python.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - docs/guide/network.md
  - docs/public/icons/notes.svg
  - docs/challenge/php-demo.md
  - docs/guide/terminal.md
  - scripts/create-challenge.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->

---
### Requirement: UnoCSS shortcuts for challenge list controls are defined in uno.config.ts

The `uno.config.ts` file SHALL define the following shortcuts for the challenge list redesign: `ch-input` (search input styling), `ch-select` (dropdown styling), `ch-view-btn` (view toggle button inactive state), `ch-view-btn-active` (view toggle button active state), `ch-tag` (tag pill styling), and `ch-list-row` (list view row styling). All shortcuts SHALL follow the existing `ch-*` naming convention and use CSS custom properties (`--ch-*`) to ensure dark/light theme compatibility.

#### Scenario: ch-input shortcut applies consistent input styling

- **WHEN** a text input element uses the `ch-input` class
- **THEN** it SHALL be styled with border, background, text color, and focus states using `--ch-*` custom properties

#### Scenario: ch-tag shortcut renders tag pills

- **WHEN** a tag element uses the `ch-tag` class
- **THEN** it SHALL render as a small pill with appropriate background and text color from `--ch-*` custom properties

#### Scenario: ch-list-row shortcut applies row styling

- **WHEN** a list view row uses the `ch-list-row` class
- **THEN** it SHALL render with border-bottom, padding, and hover state using `--ch-*` custom properties

<!-- @trace
source: challenge-list-redesign
updated: 2026-03-25
code:
  - docs/index.md
  - .vitepress/theme/style.css
  - .vitepress/theme/components/HomeContent.vue
  - docs/public/icons/browser.svg
  - docs/public/icons/terminal.svg
  - .vitepress/theme/Layout.vue
  - .vitepress/challenge/config.ts
  - .vitepress/config.mts
  - docs/challenge/fastapi-demo.md
  - docs/challenge/sqli-demo.md
  - uno.config.ts
  - docs/public/icons/code.svg
  - docs/public/icons/repeater.svg
  - .vitepress/theme/index.ts
  - docs/public/icons/network.svg
  - docs/guide/python.md
  - .vitepress/theme/components/ChallengeList.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/shared/challenges.data.ts
  - docs/guide/index.md
  - docs/guide/network.md
  - docs/public/icons/notes.svg
  - docs/challenge/php-demo.md
  - docs/guide/terminal.md
  - scripts/create-challenge.ts
tests:
  - tests/unit/scripts/create-challenge.test.ts
  - tests/unit/components/HomeContent.test.ts
-->