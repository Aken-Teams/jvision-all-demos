# JVision All Demos

This monorepo integrates 464 JVision demo projects from the `JVision-pj` GitHub organization. The 400 generated AI industry and smart-manufacturing demos are independent Next.js App Router projects; 64 legacy projects are preserved alongside them.

## Structure

- `demos/` — one folder per demo project.
- `projects-index.json` — canonical index with project metadata, demo URLs, and original GitHub URLs.
- `docs/PROJECT_INDEX.md` — human-readable project index.
- `tools/` — small utility scripts for listing and auditing the monorepo.

## Run one generated Next.js demo

Every generated project (IDs 1001-1400) can run independently from its own directory:

```bash
cd demos/jvision-ai-case-001-production-scheduler
npm install
npm run dev
```

From the monorepo root, an installed workspace can also be started by package name:

```bash
npm run dev --workspace jvision-ai-case-001-production-scheduler
```

The original static files remain in each project so the single-domain Demo Hub continues to serve `/demos/<repo>/` without requiring 400 separate servers.

## Quick checks

```bash
npm run audit:structure
npm run audit:next
npm run list:demos
```

## Note

Original nested Git repositories, deployment caches, and dependency folders are intentionally excluded.
