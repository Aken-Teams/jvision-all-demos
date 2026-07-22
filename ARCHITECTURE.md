# JVision All Demos — Architecture

## System map

```text
Browser
  │
  ├─ /                         → JV Demo catalog (index.html + app.js + styles.css)
  │                               └─ reads projects-index.json
  │
  ├─ /demos/<repo>/            → individual project snapshot / Hub route
  │
  ├─ /project-expert.html      → Project Expert Agent interface
  │
  └─ /docs/PROJECT_INDEX.md    → human-readable catalog reference

Repository
  ├─ demos/<repo>/             → independently runnable project source
  ├─ projects-index.json       → canonical catalog data
  ├─ tools/                    → conversion, audit and agent scripts
  ├─ design-system/            → shared design rules and page overrides
  ├─ shared/                   → reusable runtime assets
  └─ docs/                     → reports and project indexes
```

## Catalog flow

1. `app.js` fetches `projects-index.json` at Hub load time.
2. The client derives source labels for legacy records when `sourceGroup` is absent.
3. Search matches project ID, title, category, industry, repository name, local path, source and runtime.
4. Filters and sorting change the visible result set and synchronise to the browser URL.
5. Each card opens the single-domain Demo route and, when available, the original GitHub repository.

## Runtime model

- **Hub:** static files served from repository root (`index.html`, `app.js`, `styles.css`).
- **Generated projects:** project-level Next.js App Router applications where applicable; their preserved static files support Hub routing.
- **Legacy projects:** 59 original Next.js applications retain `src/app` as their primary runtime.
- **Other legacy demos:** retain their standalone interactive implementation.

## Data ownership

| Data | Owner / source of truth | Consumer |
| --- | --- | --- |
| Project ID, title, category, demo route, GitHub URL | `projects-index.json` | Hub and maintenance scripts |
| Human-readable project listing | `docs/PROJECT_INDEX.md` | Operators and reviewers |
| Design rules | `design-system/jvision-464-ai-saas-demos/MASTER.md` | Hub and individual demo updates |
| Quality findings | `docs/*AUDIT*`, `docs/PROJECT_EXPERT*` | Project Expert workflow and task queue |

## Change boundaries

- A catalog-only change normally touches root Hub files and `projects-index.json`.
- A project behaviour change stays within that project's `demos/<repo>/` directory unless it needs a shared rule.
- A shared visual or analytics change may touch `shared/`, design-system files and targeted demo assets; validate it broadly.

