# JVision All Demos — Architecture

## System map

```text
Browser
  │
  ├─ /                         → JV Demo catalog (index.html + app.js + styles.css)
  │                               └─ reads projects-index.json
  │
  ├─ /demos/<repo>/            → individual project snapshot / Hub route
  ├─ /share/<repo>/?token=…    → signed share-link entry, then redirects to its scoped Demo
  │
  ├─ /project-expert.html      → Project Expert Agent interface
  ├─ /admin.html               → catalog management center
  │                               └─ local drafts + authenticated PR workflow
  ├─ /api/admin/*              → login, session and GitHub PR submission
  ├─ /api/share/*              → signed project-share link issuance and scope entry
  ├─ middleware.js             → browser-share navigation containment on Vercel
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
3. Search matches project ID, title, description, category, industry, repository name and local path.
4. Filters and sorting change the visible result set and synchronise to the browser URL.
5. Each public card presents a project-specific introduction and opens only the single-domain Demo route.

## Runtime model

- **Hub:** static files served from repository root (`index.html`, `app.js`, `styles.css`).
- **Generated projects:** project-level Next.js App Router applications where applicable; their preserved static files support Hub routing.
- **Legacy projects:** 59 original Next.js applications retain `src/app` as their primary runtime.
- **Other legacy demos:** retain their standalone interactive implementation.
- **Project-share mode:** `/api/share/create` signs a repo name and expiry using `SHARE_LINK_SECRET`; `/share/<repo>/` validates the token and sets an HttpOnly scope cookie. Vercel routing middleware validates that cookie before cache and limits that browser session to the designated Demo route, required shared assets and the AI advice endpoint.

## Data ownership

| Data | Owner / source of truth | Consumer |
| --- | --- | --- |
| Project ID, title, category, demo route, GitHub URL | `projects-index.json` | Hub and maintenance scripts |
| Catalog administration drafts | browser local storage | Admin center only |
| Approved catalog administration changes | GitHub feature branch and pull request | Repository maintainers |
| Human-readable project listing | `docs/PROJECT_INDEX.md` | Operators and reviewers |
| Design rules | `design-system/jvision-464-ai-saas-demos/MASTER.md` | Hub and individual demo updates |
| Quality findings | `docs/*AUDIT*`, `docs/PROJECT_EXPERT*` | Project Expert workflow and task queue |
| Project-share signing secret | Vercel `SHARE_LINK_SECRET` environment variable | Share creation API and routing middleware only |

## Change boundaries

- A catalog-only change normally touches root Hub files and `projects-index.json`.
- The Admin center never writes directly to `main`; authenticated submissions create a feature branch and pull request through the GitHub API.
- A project behaviour change stays within that project's `demos/<repo>/` directory unless it needs a shared rule.
- A shared visual or analytics change may touch `shared/`, design-system files and targeted demo assets; validate it broadly.

