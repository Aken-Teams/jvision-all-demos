# Changelog

## 2026-07-23 — Scoped project sharing

- Added a `分享專案` control to all 464 Demo routes, with copy and system-share actions for seven-day share links.
- Added server-side HMAC signing, expiry validation, rate-limited share-link creation and HttpOnly share-scope cookies; the secret remains in Vercel environment configuration only.
- Added Vercel routing middleware that contains a shared browser session to the selected Demo, required shared assets and the AI advice endpoint; the public catalog remains public by design.
- Added repeatable coverage for token signing, tamper protection, cross-project rejection, redirect behaviour and all-464 runtime injection through `npm run test:project-share`.

## 2026-07-23 — Dynamic operational charts for all Demos

- Added a shared SVG AI-score trend chart to every Demo's analytics panel, derived from its current operational table and refreshed after data changes.
- Added 7/30-day range synchronization, a visible 75-point target line, a manual refresh action and an expandable accessible trend-data table.
- Applied responsive mobile card-table rendering and visible focus/touch states; retained each Demo's existing interactive system runtime.

## 2026-07-23 — DeepSeek AI advice for all Demos

- Added the server-only `/api/ai-advice` Vercel function with input limits, per-IP request throttling, a 15-second provider timeout and no-store responses.
- Added a shared DeepSeek advice runtime and bright, accessible advice card to all 464 Demo routes; the original system interactions continue to work alongside the AI request.
- Added a visible fallback `取得 AI 建議` action for the 64 standalone/legacy demos that do not expose a generated-system AI control.
- Added repeatable API and 464-page injection coverage through `npm run test:deepseek-ai-advice`.

## 2026-07-22 — Functional module navigation

- Added real workspace switching to all four left-navigation modules in 400 generated AI and smart-manufacturing systems.
- Added accessible active state, module context, URL hash state and responsive focus behaviour.
- Added a repeatable Playwright regression suite covering 1,600 module transitions; all 400 systems pass with zero page errors.
- Re-ran the full 464-project E2E suite with all checks passing.

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
