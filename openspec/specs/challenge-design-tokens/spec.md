# challenge-design-tokens Specification

## Purpose

Defines the CSS custom property token system used as the single source of truth for the platform's visual design — colors, palette tokens, and their integration with UnoCSS and VitePress brand variables.

## Requirements

### Requirement: Platform defines a CSS custom property token system as single source of truth

The platform SHALL define all visual design tokens as CSS custom properties with the `--ch-` prefix in `.vitepress/theme/style.css`. The `:root` selector SHALL define light mode tokens (Enterprise Indigo palette) and the `.dark` selector SHALL define dark mode tokens (Midnight Indigo palette). VitePress brand variables (`--vp-c-brand-1`, `--vp-c-brand-2`, `--vp-c-brand-3`, `--vp-c-brand-soft`) SHALL be overridden to reference the corresponding `--ch-accent-*` tokens.

#### Scenario: Dark mode tokens activate under .dark class

- **WHEN** VitePress applies the `.dark` class to the document root
- **THEN** all `--ch-*` CSS custom properties SHALL resolve to the Midnight Indigo dark palette values

#### Scenario: Light mode tokens are active by default

- **WHEN** the `.dark` class is absent from the document root
- **THEN** all `--ch-*` CSS custom properties SHALL resolve to the Enterprise Indigo light palette values

#### Scenario: VitePress brand variables delegate to ch-accent tokens

- **WHEN** any VitePress default component references `--vp-c-brand-1`
- **THEN** the resolved color SHALL match `--ch-accent-1` for the current mode

---
### Requirement: UnoCSS config references CSS vars for color tokens

The `uno.config.ts` SHALL configure `theme.colors` entries that reference `--ch-*` CSS custom properties using `var()` syntax. The config SHALL also define shortcuts for commonly used component patterns (e.g., `ch-card`, `ch-badge-easy`, `ch-badge-medium`, `ch-badge-hard`, `ch-badge-mystery`, `ch-tab-btn`, `ch-tab-btn-active`). The `content.pipeline` SHALL include `**/*.{vue,md,ts}` to ensure all utility classes used in component templates are scanned.

#### Scenario: UnoCSS color utilities resolve via CSS vars

- **WHEN** a Vue component applies a UnoCSS color utility that references a `--ch-*` var
- **THEN** the rendered CSS SHALL use `var(--ch-*)` and respond to dark/light mode switching without additional class changes

#### Scenario: ch-badge-easy shortcut applies correct semantic color

- **WHEN** the `ch-badge-easy` shortcut is applied to an element
- **THEN** the element SHALL display with the easy difficulty color (green tones in both modes)

---
### Requirement: Merged nav design tokens

The theme SHALL provide CSS custom properties for the merged navigation bar styling, using the existing `--ch-*` Midnight Indigo palette to ensure visual consistency with the rest of the challenge layout.

#### Scenario: Merged nav uses ch palette

- **WHEN** the merged nav bar renders
- **THEN** its background uses `--ch-bg`, text uses `--ch-text-1`, and accents use `--ch-accent`

<!-- @trace
source: challenge-ux-overhaul
updated: 2026-03-25
code:
  - .vitepress/theme/style.css
  - docs/challenge/php-demo/index.md
  - .vitepress/challenge/plugin.ts
  - .vitepress/theme/components/DescriptionModal.vue
  - .vitepress/theme/composables/usePythonRuntime.ts
  - docs/challenge/sqli-demo/src/app.py
  - docs/challenge/sqli-demo/index.md
  - scripts/challenge-analyze.ts
  - docs/challenge/fastapi-demo.md
  - docs/challenge/fastapi-demo/src/app.py
  - scripts/challenge-utils.ts
  - docs/challenge/php-demo/index.php
  - docs/challenge/fastapi-demo/index.md
  - docs/challenge/php-demo/src/flag.txt
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - docs/challenge/sqli-demo/flag.txt
  - package.json
  - .vitepress/challenge/config.ts
  - scripts/fsignore.ts
  - scripts/challenge-validate.ts
  - scripts/challenge-keygen.ts
  - docs/challenge/php-demo/src/index.php
  - .vitepress/theme/composables/useWxlsh.ts
  - uno.config.ts
  - docs/challenge/php-demo/flag.txt
  - .vitepress/theme/components/BrowserChrome.vue
  - docs/challenge/sqli-demo/app.py
  - .vitepress/theme/components/MergedNav.vue
  - docs/challenge/fastapi-demo/app.py
  - .vitepress/theme/composables/useUserVfs.ts
  - .vitepress/theme/components/BrowserPanel.vue
  - docs/challenge/fastapi-demo/flag.txt
  - docs/challenge/php-demo.md
  - docs/challenge/fastapi-demo/src/flag.txt
  - docs/challenge/sqli-demo/src/flag.txt
  - scripts/create-challenge.ts
  - docs/challenge/sqli-demo.md
tests:
  - tests/unit/composables/useWxlsh-tiers.test.ts
  - tests/challenge-analyze.test.ts
  - tests/unit/theme/challenge-design-tokens.test.ts
  - tests/unit/challenge/config.test.ts
  - tests/unit/components/MergedNav.test.ts
  - tests/unit/composables/useWxlsh-tier3.test.ts
  - tests/unit/composables/useWxlsh-tier2.test.ts
  - tests/unit/composables/usePythonRuntime.test.ts
  - tests/unit/components/DescriptionModal.test.ts
  - tests/unit/composables/useUserVfs.test.ts
  - tests/unit/composables/usePythonRuntime-packages.test.ts
  - tests/unit/components/BrowserChrome.test.ts
  - tests/unit/composables/usePythonRuntime-fs.test.ts
  - tests/unit/scripts/create-challenge.test.ts
  - tests/challenge-validate.test.ts
  - tests/unit/composables/usePythonRuntime-requests.test.ts
  - tests/fsignore.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/theme/challenge-rwd.test.ts
  - tests/challenge-utils.test.ts
  - tests/unit/composables/useWxlsh-tier4.test.ts
  - tests/unit/composables/usePythonRuntime-request.test.ts
-->