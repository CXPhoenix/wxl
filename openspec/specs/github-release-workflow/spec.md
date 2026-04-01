# github-release-workflow Specification

## Purpose

TBD - created by archiving change 'add-release-github-action'. Update Purpose after archive.

## Requirements

### Requirement: Tag-triggered release workflow

The system SHALL provide a GitHub Actions workflow at `.github/workflows/release.yml` that triggers when a tag matching `v*` pattern is pushed to the repository.

#### Scenario: Tag push triggers workflow

- **WHEN** a git tag matching `v*` (e.g., `v0.6.0`) is pushed to the repository
- **THEN** the release workflow SHALL be triggered automatically

#### Scenario: Non-tag push does not trigger

- **WHEN** a regular commit is pushed to any branch without a `v*` tag
- **THEN** the release workflow SHALL NOT be triggered


<!-- @trace
source: add-release-github-action
updated: 2026-03-23
code:
  - .github/workflows/release.yml
  - package.json
-->

---
### Requirement: Complete build pipeline execution

The workflow SHALL execute the full build pipeline in order: install Rust toolchain and wasm-pack → install binaryen (wasm-opt) → install Node.js and pnpm → install dependencies → wasm:build → challenge:keygen → **test --run** → **challenge:validate** → docs:build. The test and validation steps SHALL run after challenge:keygen (which generates files needed by tests) and before docs:build. If either `pnpm test --run` or `pnpm challenge:validate` fails, the workflow SHALL stop and no GitHub Release SHALL be created.

#### Scenario: Successful build pipeline with tests and validation

- **WHEN** the workflow is triggered by a valid tag push
- **THEN** the workflow SHALL execute `pnpm wasm:build`, `pnpm challenge:keygen`, `pnpm test --run`, `pnpm challenge:validate`, and `pnpm docs:build` in sequence
- **AND** the `.vitepress/dist` directory SHALL contain the built static site

#### Scenario: Test failure halts workflow before building

- **WHEN** `pnpm test --run` fails during the workflow
- **THEN** the workflow SHALL stop and report the failure
- **AND** `pnpm docs:build` SHALL NOT execute
- **AND** no GitHub Release SHALL be created

#### Scenario: Validation failure halts workflow before building

- **WHEN** `pnpm challenge:validate` fails during the workflow
- **THEN** the workflow SHALL stop and report the failure
- **AND** `pnpm docs:build` SHALL NOT execute
- **AND** no GitHub Release SHALL be created

#### Scenario: Build failure halts workflow

- **WHEN** any step in the build pipeline fails
- **THEN** the workflow SHALL stop and report the failure
- **AND** no GitHub Release SHALL be created


<!-- @trace
source: fix-release-workflow
updated: 2026-03-25
code:
  - tsconfig.json
  - .github/workflows/release.yml
  - .vitepress/theme/index.ts
  - docs/shared/challenges.data.ts
  - package.json
-->

---
### Requirement: Artifact packaging

The workflow SHALL package the `.vitepress/dist` directory into a zip file named `wxl-{tag}.zip` where `{tag}` is the git tag that triggered the workflow (e.g., `wxl-v1.0.0.zip`).

#### Scenario: Dist directory packaged as zip

- **WHEN** the build pipeline completes successfully
- **THEN** the workflow SHALL create a zip file containing the contents of `.vitepress/dist`
- **AND** the zip filename SHALL include the triggering tag name


<!-- @trace
source: add-release-github-action
updated: 2026-03-23
code:
  - .github/workflows/release.yml
  - package.json
-->

---
### Requirement: GitHub Release creation with asset

The workflow SHALL create a GitHub Release associated with the triggering tag and attach the zip artifact as a downloadable release asset.

#### Scenario: Release created with zip asset

- **WHEN** the zip artifact is successfully created
- **THEN** the workflow SHALL create a GitHub Release with the name `Release {tag}`
- **AND** the zip file SHALL be attached as a release asset
- **AND** the release SHALL use GitHub auto-generated release notes


<!-- @trace
source: add-release-github-action
updated: 2026-03-23
code:
  - .github/workflows/release.yml
  - package.json
-->

---
### Requirement: Rust build caching

The workflow SHALL use Rust compilation caching to reduce build times for subsequent runs.

#### Scenario: Cache hit reduces build time

- **WHEN** the workflow runs and a valid Rust cache exists from a previous run
- **THEN** the workflow SHALL restore the cached Rust compilation artifacts
- **AND** the Rust/WASM build step SHALL complete faster than a cold build

<!-- @trace
source: add-release-github-action
updated: 2026-03-23
code:
  - .github/workflows/release.yml
  - package.json
-->