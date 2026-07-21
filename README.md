# JVision All Demos

This monorepo integrates 464 JVision demo projects from the `JVision-pj` GitHub organization. The 400 generated AI industry and smart-manufacturing demos and 59 legacy applications are independent Next.js App Router projects; the remaining 5 legacy demos keep their interactive standalone implementation.

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

## Run one legacy Next.js app

The 59 original Next.js applications use their preserved `src/app` source as the primary runtime:

```bash
cd demos/jvision-production-order
npm install
npm run dev
```

Their root `index.html` files are compatibility snapshots for the single-domain Hub, not the project runtime. The canonical list is `docs/LEGACY_NEXT_PROJECTS.json`.

## Professional light SaaS design

The Hub and all 464 demos use a shared light, high-contrast AI SaaS design layer. Industry-specific accent colors and layouts remain independent, while typography, surface brightness, form clarity, focus states, and text contrast follow the same quality baseline.

## Quick checks

```bash
npm run audit:structure
npm run audit:next
npm run audit:legacy-next
npm run audit:bright-saas
npm run list:demos
```

## Note

Original nested Git repositories, deployment caches, and dependency folders are intentionally excluded.
