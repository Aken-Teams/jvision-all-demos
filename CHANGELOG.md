# Changelog

## 2026-07-22 — Complete project E2E coverage

- Added a repeatable Playwright E2E runner for all 464 demos with route, content, interaction, browser-error and responsive-overflow checks.
- Added machine-readable and human-readable full-run reports under `docs/`.
- Fixed mobile workspace overflow in sales-enablement case 140 and sales-handover case 150.

## 2026-07-22 — Public catalog descriptions

- Added a concise, project-specific introduction to all 464 catalog records based on each project README.
- Removed GitHub actions, repository metadata, source provenance and legacy-system wording from public project cards.
- Added description editing to the catalog management workflow.
- Reclassified all projects under one clear primary business domain and removed the Next.js/runtime badge from public cards.

## 2026-07-22 — Catalog management center

- Added searchable project administration with metadata editing, status controls, featured flags and batch actions.
- Added browser-local change drafts and a reviewable change summary.
- Added authenticated Vercel API endpoints that create GitHub feature branches and pull requests instead of writing to `main`.
- Added public catalog handling for draft and archived projects.

## Unreleased

### Added

- Context Engineering documentation: working agreement, roadmap, progress, decision log, task queue, durable context and architecture reference.
- Real runtime screenshots for every Demo card, generated from the formal-site audit captures.

### Changed

- Reframed the Hub homepage as the retrieval-first **JV Demo 網站** catalog.
- Added catalog search suggestions, source/runtime/GitHub/category facets, sorting, quick filters, zero-result recovery and URL-backed filter state.

## 2026-07-22

### Added

- Bright SaaS presentation, responsive analytics layer, Project Expert Agent and quality audit tooling across the demo library.
- Reports for formal-site review, mobile analytics and Project Expert acceptance under `docs/`.

### Changed

- Standardised the public Demo entry pattern to the single-domain route `/demos/<repo>/`.
