# JVision All Demos — Progress

Last updated: 2026-07-22

## Current state

- **Catalog:** 464 projects are represented in `projects-index.json` and the Hub.
- **Single-domain access:** Demo links use `/demos/<repo>/`; the Hub does not direct visitors to the old per-project Vercel URLs.
- **Homepage:** Reworked into the JV Demo search interface with live suggestions, business-category filtering, sorting, chips and sharable URL state.
- **Classification:** All projects use one primary business category; combined labels such as education/care were split into distinct education and healthcare categories. Public cards no longer show implementation frameworks.
- **Public project summaries:** Every catalog project has a README-derived introduction; cards no longer expose repository names, GitHub actions or legacy-source labels.
- **System illustrations:** Project cards use actual captured runtime screens instead of generic artwork.
- **Visual baseline:** Light, clear, professional AI SaaS styling has been applied across the library, with responsive analytics support.
- **Quality process:** Project Expert Agent, acceptance test, formal site audit and mobile analytics audit are available in `tools/` and `docs/`.
- **GitHub:** Catalog administration is being delivered on `feat/catalog-admin` through a pull request to `main`.
- **Catalog administration:** A dedicated management center supports search, editing, bulk status changes, featured flags, local drafts and authenticated GitHub PR submission.

## Latest verification

- Full Chromium E2E coverage passed for all 464 projects: routes, desktop/mobile content, one safe interaction per project, browser errors and exposed horizontal overflow.
- The E2E run found and fixed mobile width defects in smart-manufacturing cases 140 and 150.
- `node --check app.js` passed for the catalog implementation.
- Browser checks verified suggestion rendering, source filtering (300 smart-manufacturing projects), URL state, a zero-result state and a 390px mobile viewport.
- The catalog browser console had no errors during that check.
- Earlier repository reports record the full Project Expert and mobile analytics checks; see `docs/PROJECT_EXPERT_ACCEPTANCE_REPORT.md` and `docs/MOBILE_ANALYTICS_AUDIT.md`.

## Next action

Configure the Admin environment values in Vercel, review the catalog-admin PR and verify the authenticated PR submission flow in Preview before merging.
