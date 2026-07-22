# JVision All Demos — Agent Working Agreement

## Purpose

This repository is the single-domain JV Demo website and its 464 independently runnable demo projects. The public hub is a discovery and retrieval interface; each demo must remain a credible, responsive, light-theme AI SaaS experience.

## Start-of-task protocol

Before changing code, read these files in order:

1. `MEMORY.md` — durable project facts and user preferences.
2. `PROGRESS.md` — current milestone and completed work.
3. `TASKS.md` — prioritised work that is still open.
4. `DECISIONS.md` — decisions that must not be silently reversed.
5. `ARCHITECTURE.md` — routes, data ownership and runtime boundaries.

For UI work, also read `design-system/jvision-464-ai-saas-demos/MASTER.md` and the page override that applies to the screen being changed.

## Implementation rules

- Keep every project reachable through the one JV domain: `/demos/<repo>/`.
- Do not add a new Vercel production deployment for an individual demo.
- Preserve a demo's independent runtime; do not replace an interactive demo with a static placeholder.
- Use `projects-index.json` as the canonical source for the Hub catalog.
- Keep the visual baseline bright, clear, professional and mobile-first. Every important action needs a visible focus state and a usable touch target.
- Prefer targeted changes. The repository contains many generated files; do not reformat or regenerate unrelated projects.
- Never store passwords, access tokens or private network details in project documentation or commits.

## Completion protocol

1. Run the narrowest relevant check first.
2. For Hub/UI changes, verify desktop and a narrow mobile viewport in a browser and check the console.
3. Update `PROGRESS.md`, `TASKS.md` and `CHANGELOG.md` in the same change when the work affects project state.
4. Record any lasting architectural choice in `DECISIONS.md`.
5. Commit on a feature branch and open or update a PR; do not push implementation changes directly to `main`.

## Useful checks

```bash
npm run audit:structure
npm run audit:next
npm run audit:legacy-next
npm run audit:bright-saas
npm run audit:formal-sites
npm run audit:mobile-analytics
npm run test:project-expert
```

