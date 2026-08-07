# Changelog

## 2026-08-06

- Fixed the WCS and ICT Test Data Management Hub snapshots so their stylesheet links load normally instead of rendering as plain text.
- Completed a 463-route Chromium audit covering desktop/mobile content, stylesheet loading, safe interactions, browser errors and horizontal overflow; all routes pass.
- Added shared responsive containment plus targeted table fixes for Event Wedding and HRIS, and accepted Bakery's harmless subpixel-width variance.
- Localized TMS and Fashion PLM logo assets and added the Hub root favicon to remove avoidable external/missing-resource failures.
- Expanded the full-Demo E2E report with stylesheet/resource diagnostics, system-Chrome and targeted-run support, stylesheet readiness waits and safe non-submit interactions.

## 2026-07-30 — Temple thumbnail and property classification

- Corrected the Temple Management thumbnail sequence after the catalog changed from 464 to 463 projects.
- Verified all 463 expected catalog thumbnails exist and load successfully.
- Reclassified Property Management from `企業營運` to `房地產與物業`.
- Replaced stale `既有系統 / 舊專案` industry metadata with each project's actual category.

## 2026-07-30 — Consistent catalog card heights

- Reserved two lines for desktop project titles and four lines for descriptions so longer copy no longer changes card height.
- Kept natural text height on mobile where cards are displayed in a single column.
- Browser verification confirmed equal heights within catalog rows, no console errors and no horizontal overflow.
- Full RWD verification passed 463/463 Demo routes and all three Hub viewports.

## 2026-07-30 — Portfolio-wide purpose-specific content

- Replaced category-template descriptions across all 463 projects with project-purpose content.
- Restored 299 generated systems from their original functions, departments, pain points, workflows, integrations and KPIs.
- Restored 157 projects from their own product descriptions and rebuilt matching actions, inputs and outputs.
- Added manually authored operational definitions for seven projects whose source pages lacked usable metadata or needed a semantic workflow correction.
- Added a same-industry description-similarity audit; high-similarity pairs dropped from 1,553 to 0.
- Passed 463/463 showcase, semantic-workflow, process-blueprint, business-realism and responsive-layout verification.

## 2026-07-30 — Sales project differentiation

- Rewrote all 39 sales project introductions, customer situations and daily-use descriptions around their actual business purpose.
- Added distinct customer workflows for CRM, RFQ, pipeline, quotation, CPQ, credit, commissions, collections, renewal, handover and the remaining sales systems.
- Verified 39/39 unique sales descriptions, situations, daily-use narratives and workflow definitions.
- Passed 463/463 customer-showcase, semantic-workflow, process-blueprint, business-realism and responsive-layout checks.

## 2026-07-30 — Industry-specific catalog and Demo workflows

- Aligned catalog card heights per grid row so cards with longer names or descriptions no longer leave shorter neighboring cards and misaligned actions.
- Reworked 451 non-transport projects so introductions, operating situations and daily-use descriptions are derived from each project's subject instead of a shared industry paragraph.
- Added project-level customer workflow metadata covering the operating role, required inputs, three customer actions, decision choices and resulting business record.
- Preserved the 10 dedicated transport workflows and differentiated two previously identical WMS catalog entries by their actual operating focus.
- Passed 463/463 customer-showcase uniqueness, semantic workflow, process-blueprint, business-realism and responsive-layout verification.

## 2026-07-30 — Workflow coverage for every project

- Standardized actionable workflow coverage across all 463 projects.
- Added explicit saved-record destinations, updated-row highlighting and latest-operation details to governed workflows.
- Kept OEE and property management on their purpose-built multi-step operational interfaces.
- Full workflow browser verification passed 463/463 projects.

## 2026-07-30 — Actionable follow-up and closure stages

- Replaced one-click stage advancement in all 400 functional-module systems with required on-screen action forms.
- Added dedicated follow-up fields for contact method, outcome, next-contact date and handling notes.
- Added dedicated closure fields for closure outcome, confirmer, completion date and closure notes.
- Added repeatable browser coverage for stage-form submission and state persistence.

## 2026-07-30 — Project-specific process governance

- Added a process blueprint for every catalog project, covering stage ownership, required inputs, executable actions, approval and rejection rules, and expected outputs.
- Added visible process rules to project details and operation dialogs.
- Limited approval permissions to the actual approval stage and recorded the responsible and approving roles in generated workflow documents.
- Added `audit:project-process-blueprints` and extended operation-dialog E2E checks to cover governance and output metadata.

## 2026-07-29 — Domain-specific operations and full acceptance

- Removed the Showcase Vercel entry and its single-item content-management category from the public catalog while preserving its local source for recovery.
- Replaced 174 generic workflow fallbacks with category-specific operational workflows, leaving 463 domain workflows and one dedicated OEE workflow.
- Added project-level differentiation inside each category using the project's scenario, daily use, metrics and customer-facing title.
- Added validated create/edit forms, persistent detail updates, operation feedback and a clear completed-flow summary.
- Fixed hidden forms being displayed before their related action was selected.
- Added a narrow-screen table safeguard for preserved interfaces.
- Localised all 64 preserved legacy catalog titles.
- Updated mobile and Project Expert acceptance to validate an operational workflow when generic analytics are intentionally absent.
- Refreshed all shared runtime cache keys and verified 463/463 catalog routes, desktop/mobile layouts and interactions.
- Audited 309 original-interface buttons across 63 cataloged preserved projects with zero no-response findings.

## 2026-07-27 — Original interface action verification

- Added a repeatable browser audit for visible enabled buttons in all 64 preserved original project interfaces.
- Verified 321 original-interface buttons with zero confirmed no-response actions after independent retry.
- Verified all 464 shared customer-workflow surfaces through the full workflow button suite.

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
