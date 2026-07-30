# JVision All Demos — Progress

Last updated: 2026-07-30

## Current state

- **Catalog:** 463 projects are represented in `projects-index.json` and the Hub.
- **Single-domain access:** Demo links use `/demos/<repo>/`; the Hub does not direct visitors to the old per-project Vercel URLs.
- **Homepage:** Reworked into the JV Demo search interface with live suggestions, business-category filtering, sorting, chips and sharable URL state.
- **Classification:** All projects use one primary business category; combined labels such as education/care were split into distinct education and healthcare categories. Public cards no longer show implementation frameworks.
- **Public project summaries:** Every catalog project has a README-derived introduction; cards no longer expose repository names, GitHub actions or legacy-source labels.
- **Functional module navigation:** All 400 generated AI and smart-manufacturing systems switch real workspace regions from their left module navigation.
- **System illustrations:** Project cards use actual captured runtime screens instead of generic artwork.
- **Visual baseline:** Light, clear, professional AI SaaS styling has been applied across the library, with responsive analytics support.
- **Quality process:** Project Expert Agent, acceptance test, formal site audit and mobile analytics audit are available in `tools/` and `docs/`.
- **GitHub:** Catalog administration is being delivered on `feat/catalog-admin` through a pull request to `main`.
- **Catalog administration:** A dedicated management center supports search, editing, bulk status changes, featured flags, local drafts and authenticated GitHub PR submission.
- **DeepSeek AI advice:** Every Demo has a server-side DeepSeek advice path. The 400 generated systems use their existing AI action; the other 64 receive an equivalent on-demand AI advice control.
- **Dynamic analytics:** Every Demo now adds an AI score trend chart beside its operational statistics, with 7/30-day switching, data refresh, an accessible target line and an expandable data table.
- **Project sharing:** Every Demo can generate a signed, seven-day project-share link. Opening it creates a browser-scoped navigation lock that permits only the shared Demo and its required runtime assets.

## Latest verification

- Catalog cards now stretch to the tallest item in each grid row, keeping practical-use and Demo actions aligned even when project titles or introductions wrap to different line counts. Browser verification of the eight information-security cards confirmed equal heights within every desktop row and no horizontal overflow.
- All 28 industries now use project-specific catalog copy and customer workflows. A reusable differentiation pass rewrote 451 non-transport projects from each project's actual subject, responsible role, required inputs, review point and output; the 10 transport projects retain their dedicated vehicle, parking, cold-chain, rental and driver-roster flows.
- Customer-showcase uniqueness passed 463/463 for both stories and outputs. Semantic workflows, process blueprints and business-realism audits passed 463/463.
- Full responsive verification passed 463/463 demos with no tablet/mobile overflow and compliant touch targets; the Hub passed all three target viewports.
- Every project now exposes an actionable end-to-end workflow: 461 projects use the governed domain workflow, while OEE and property management retain dedicated multi-step operational workflows. The governed flows now show an explicit saved-record destination, highlight the updated row and expose the latest operation beside the generated result document; full browser verification passed 463/463 projects.
- All 400 functional-module systems now require an on-screen stage action form instead of a one-click status button. Follow-up stages capture contact method, outcome and next-contact date; closure stages capture closure outcome, confirmer and completion date. Browser submission coverage passed 400/400 projects.
- All 463 projects now receive a project process blueprint that explicitly defines the responsible role, required inputs, stage action, approval/pass/reject conditions and output for every workflow stage.
- Workflow operation dialogs expose those rules before execution, enforce the designated approval role at the actual approval stage and include ownership, approval and output metadata in the generated result document.
- Process-blueprint completeness, semantic workflow and business-realism audits passed 463/463 projects; full browser operation coverage passed 463/463 projects with 460 distinct project checklist signatures.

- All 463 catalog projects now use a domain-specific customer workflow; 462 use category operations and the OEE project keeps its dedicated workflow. No project falls back to the generic workflow.
- Same-category projects now use project-specific scenarios, daily-use copy, metrics and sample records instead of repeating identical demo data.
- Customer workflows now support validated creation, editable details, processing notes, persistent status feedback and a visible completion summary.
- Full desktop/mobile E2E verification passed 463/463 routes, interactions and responsive overflow checks.
- Project Expert functional acceptance passed 463/463 projects.
- The 63 cataloged preserved interfaces covered 309 enabled buttons with zero confirmed no-response actions.
- All 64 legacy catalog titles now use customer-readable Chinese product names, retaining standard acronyms only where useful.
- The 57 cataloged preserved Next.js snapshots still emit a recoverable React #418 hydration warning; functional interaction, HTTP, desktop and mobile checks all pass, so audits record it as a compatibility warning rather than a product failure.

- All 464 shared customer-workflow surfaces passed the stage/action coverage check; all 64 preserved original interfaces were then audited separately, covering 321 visible enabled buttons with zero confirmed no-response actions.
- Full Chromium E2E coverage passed for all 464 projects: routes, desktop/mobile content, one safe interaction per project, browser errors and exposed horizontal overflow.
- Dedicated module-navigation coverage passed 1,600/1,600 left-menu transitions across 400 generated systems with zero page errors.
- The E2E run found and fixed mobile width defects in smart-manufacturing cases 140 and 150.
- `node --check app.js` passed for the catalog implementation.
- Browser checks verified suggestion rendering, source filtering (300 smart-manufacturing projects), URL state, a zero-result state and a 390px mobile viewport.
- The catalog browser console had no errors during that check.
- Earlier repository reports record the full Project Expert and mobile analytics checks; see `docs/PROJECT_EXPERT_ACCEPTANCE_REPORT.md` and `docs/MOBILE_ANALYTICS_AUDIT.md`.
- `npm run test:deepseek-ai-advice` verifies all 464 pages load the common runtime and uses a mocked provider response to validate the protected serverless endpoint.
- Desktop and 390px mobile browser checks confirmed that an existing system AI action and a legacy-system fallback action both render an accessible, actionable advice card.
- npm run test:dynamic-charts confirms the dynamic-chart layer is present on all 464 static routes and all 459 retained Next.js layouts.
- Browser checks confirmed the warehouse Demo updates the chart for the 7/30-day switch and expandable data table; the legacy care Demo shows the same chart at a 390px mobile viewport.
- `npm run test:project-share` validates signed-link creation, tamper and cross-project rejection, protected scope cookies, the redirect target and share-runtime coverage on all 464 routes.
- The scoped project-share layer was built and deployed successfully to the canonical Vercel production domain on 2026-07-23; the Vercel build compiled the routing middleware and both share API functions.

## 2026-07-30 — Sales portfolio content

- Differentiated all 39 sales projects by business object, operating role, required inputs, daily action, review condition and output record.
- Confirmed 39 unique descriptions, operating situations, daily-use narratives and customer workflows.
- Regenerated the 39 affected Demo pages; all 463 projects continue to pass workflow, realism and responsive-layout audits.

## 2026-07-30 — All-industry content differentiation

- Rebuilt all 463 catalog descriptions and customer workflows from each project's original functional specification or product description.
- Restored project-specific functions, operating departments, pain points, workflow stages, integrations and KPIs instead of category-level templates.
- Added `audit:description-similarity`; zero same-industry description pairs remain above the 0.72 similarity threshold.
- Full verification passed: 463/463 customer showcases, semantic workflows, process blueprints, business realism and RWD.

## Next action

Review the refreshed catalog and representative domain workflows in a normal browser session before opening a delivery PR.
