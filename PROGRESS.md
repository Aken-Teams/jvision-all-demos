# JVision All Demos — Progress

Last updated: 2026-07-23

## Current state

- **Catalog:** 464 projects are represented in `projects-index.json` and the Hub.
- **Single-domain access:** Demo links use `/demos/<repo>/`; the Hub does not direct visitors to the old per-project Vercel URLs.
- **Homepage:** Reworked into the JV Demo search interface with live suggestions, business-category filtering, sorting, chips and sharable URL state.
- **Homepage impact:** Added an evidence-led hero with direct Demo-search CTA, animated 464-system network, industry signal stream, count-up and reduced-motion-aware reveal effects while keeping retrieval immediately below the hero.
- **Practical catalog content:** All 464 cards now describe a concrete user, operating event, daily use and observable business metrics; practical problem terms are searchable.
- **Practical generated Demos:** All 400 generated systems use deterministic Taiwan-SME scenarios, absolute dates, meaningful records, explainable decision rules, versioned browser state and guided/free entry modes.
- **Classification:** All projects use one primary business category; combined labels such as education/care were split into distinct education and healthcare categories. Public cards no longer show implementation frameworks.
- **Public project summaries:** Every catalog project has a README-derived introduction; cards no longer expose repository names, GitHub actions or legacy-source labels.
- **Functional module navigation:** All 400 generated AI and smart-manufacturing systems switch real workspace regions from their left module navigation.
- **System illustrations:** Project cards use actual captured runtime screens instead of generic artwork.
- **Visual baseline:** Light, clear, professional AI SaaS styling has been applied across the library, with responsive analytics support.
- **Quality process:** Project Expert Agent, acceptance test, formal site audit and mobile analytics audit are available in `tools/` and `docs/`.
- **GitHub:** Catalog administration is being delivered on `feat/catalog-admin` through a pull request to `main`.
- **Catalog administration:** A dedicated management center supports search, editing, bulk status changes, featured flags, local drafts and authenticated GitHub PR submission.
- **AI advice:** Every Demo has a provider-neutral AI advice experience. The 400 generated systems use their existing AI action; the other 64 receive an equivalent on-demand AI advice control, while provider details stay server-side.
- **Dynamic analytics:** Every Demo now adds an AI score trend chart beside its operational statistics, with 7/30-day switching, data refresh, an accessible target line and an expandable data table.
- **Project sharing:** Every Demo can generate a signed, seven-day project-share link. Opening it creates a browser-scoped navigation lock that permits only the shared Demo and its required runtime assets.
- **Self-hosted runtime:** The internal deployment now uses one Node entry point for static Demo files, AI advice, signed share links and browser-scoped share containment on the existing LAN address.

## Latest verification

- Practical-content audit passed: 464 complete catalog records, 29 category profiles, 400 valid full scenarios, 464 unique descriptions and zero placeholder-content failures.
- Practical workflow coverage passed 400/400: four-step guided flow, at least two actionable exceptions, deterministic recalculation and data reset.
- Updated module-navigation coverage passed 1,600/1,600 transitions with zero page errors.
- Homepage desktop/mobile checks passed practical-detail expansion, `缺料` search, full-scenario/catalog-only entry rules, mobile overflow and browser-console checks.
- The current all-Demo E2E run passed routes, content, interaction and mobile overflow for 464/464. The 400 changed generated Demos and five other static Demos had zero browser errors; 59 unchanged legacy Next.js snapshots emitted their existing React hydration #418 warning and remain outside this content-only internal-change scope.
- Full Chromium E2E coverage passed for all 464 projects: routes, desktop/mobile content, one safe interaction per project, browser errors and exposed horizontal overflow.
- Dedicated module-navigation coverage passed 1,600/1,600 left-menu transitions across 400 generated systems with zero page errors.
- The E2E run found and fixed mobile width defects in smart-manufacturing cases 140 and 150.
- `node --check app.js` passed for the catalog implementation.
- Browser checks verified suggestion rendering, source filtering (300 smart-manufacturing projects), URL state, a zero-result state and a 390px mobile viewport.
- The catalog browser console had no errors during that check.
- The homepage impact refresh passed targeted Chromium checks at 1440px and 390px: the 464 count loaded, the primary CTA focused search, document width matched the mobile viewport and the console reported zero errors or warnings.
- Earlier repository reports record the full Project Expert and mobile analytics checks; see `docs/PROJECT_EXPERT_ACCEPTANCE_REPORT.md` and `docs/MOBILE_ANALYTICS_AUDIT.md`.
- `npm run test:deepseek-ai-advice` verifies all 464 pages load the common runtime and uses a mocked provider response to validate the protected serverless endpoint.
- Desktop and 390px mobile browser checks confirmed that an existing system AI action and a legacy-system fallback action both render an accessible, actionable advice card.
- The shared AI panel now uses provider-neutral `AI` branding across all 464 Demo pages, with a bumped asset version to prevent stale browser caches.
- npm run test:dynamic-charts confirms the dynamic-chart layer is present on all 464 static routes and all 459 retained Next.js layouts.
- Browser checks confirmed the warehouse Demo updates the chart for the 7/30-day switch and expandable data table; the legacy care Demo shows the same chart at a 390px mobile viewport.
- `npm run test:project-share` validates signed-link creation, tamper and cross-project rejection, protected scope cookies, the redirect target and share-runtime coverage on all 464 routes.
- The scoped project-share layer was built and deployed successfully to the canonical Vercel production domain on 2026-07-23; the Vercel build compiled the routing middleware and both share API functions.
- `npm run test:self-hosted-runtime` verifies static delivery, share-link creation and entry, LAN-compatible protected cookies, scoped-navigation blocking and the AI API route.

## Next action

Resolve the pre-existing React hydration #418 warning in the 59 legacy Next.js snapshots without changing their public behaviour, then restore the all-464 zero-browser-error baseline.
