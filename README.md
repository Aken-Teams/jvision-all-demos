# JVision All Demos

This monorepo integrates the 400 JVision demo projects that are available under the `JVision-pj` GitHub organization.

## Structure

- `demos/` — one folder per demo project.
- `projects-index.json` — canonical index with project metadata, demo URLs, and original GitHub URLs.
- `docs/PROJECT_INDEX.md` — human-readable project index.
- `tools/` — small utility scripts for listing and auditing the monorepo.

## Quick checks

```bash
npm run audit:structure
npm run list:demos
```

## Note

Original nested Git repositories, deployment caches, and dependency folders are intentionally excluded.
