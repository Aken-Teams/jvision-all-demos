# JVision All Demos — Decision Log

| Date | Decision | Rationale | Consequence |
| --- | --- | --- | --- |
| 2026-07-22 | Use one public JV Demo domain. | Visitors need one reliable entry point for all projects. | Hub links use `/demos/<repo>/`; do not expose old per-project Vercel URLs as the primary Demo action. |
| 2026-07-22 | Make the homepage retrieval-first rather than marketing-first. | The site is a company demo catalog, not a landing page. | Keep copy compact; prioritise search, facets, result count and direct Demo links. |
| 2026-07-22 | Keep every project independently runnable. | The monorepo must preserve project-level evaluation and development. | Do not collapse projects into static placeholders solely for Hub rendering. |
| 2026-07-22 | Use `projects-index.json` as Hub catalog source of truth. | Catalog data needs one auditable location. | Update it when a project's public route, repo or classification changes. |
| 2026-07-22 | Use a light, high-contrast professional SaaS baseline. | The product represents JV's AI-enabled SaaS capability and must remain clear on desktop and mobile. | Individual project style may vary, but contrast, responsive behaviour, forms and statistics views must meet the shared baseline. |
| 2026-07-22 | Keep Vercel production deployment out of the per-project workflow. | The target experience is one-domain hosting, not hundreds of separate deployments. | Validate locally/self-hosted and use the single-domain publishing path when release is required. |
| 2026-07-22 | Route catalog administration through GitHub pull requests. | The public site must not expose repository credentials or permit direct production writes. | Admin edits remain local drafts until an authenticated server action creates a feature branch and PR. |

Add a row whenever a decision changes public routes, architecture, data ownership, design policy or deployment policy.

