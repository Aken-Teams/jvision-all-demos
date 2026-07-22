# JVision All Demos — Progress

Last updated: 2026-07-22

## Current state

- **Catalog:** 464 projects are represented in `projects-index.json` and the Hub.
- **Single-domain access:** Demo links use `/demos/<repo>/`; the Hub does not direct visitors to the old per-project Vercel URLs.
- **Homepage:** Reworked into the JV Demo search interface with live suggestions, category/source/runtime/GitHub filters, sorting, chips and sharable URL state.
- **Visual baseline:** Light, clear, professional AI SaaS styling has been applied across the library, with responsive analytics support.
- **Quality process:** Project Expert Agent, acceptance test, formal site audit and mobile analytics audit are available in `tools/` and `docs/`.
- **GitHub:** The current feature branch is `feat/jv-demo-catalog-search`; PR #1 targets `main`.

## Latest verification

- `node --check app.js` passed for the catalog implementation.
- Browser checks verified suggestion rendering, source filtering (300 smart-manufacturing projects), URL state, a zero-result state and a 390px mobile viewport.
- The catalog browser console had no errors during that check.
- Earlier repository reports record the full Project Expert and mobile analytics checks; see `docs/PROJECT_EXPERT_ACCEPTANCE_REPORT.md` and `docs/MOBILE_ANALYTICS_AUDIT.md`.

## Next action

Use `TASKS.md` to choose the next scoped improvement. For a new demo or a broken audit, update its catalog metadata and run the relevant targeted validation before broad audits.

