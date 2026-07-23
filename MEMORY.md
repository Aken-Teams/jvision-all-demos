# JVision All Demos — Durable Context

This file captures project facts that should persist across tasks. Keep it concise and factual; use `DECISIONS.md` for the reasoning behind a choice and `PROGRESS.md` for changing status.

## Product identity

- Product name: **JV Demo 網站**.
- Audience: JV company visitors who need to explore concrete AI-enabled SaaS and industry demo projects.
- Tone: professional, clear and evidence-led; avoid inflated marketing copy.
- Visual direction: bright, high-contrast, mobile-ready SaaS interfaces with meaningful statistics and workflows.

## Non-negotiable operating rules

- One public domain is the demo entry point.
- Each of the 464 projects remains independently runnable in the monorepo.
- Do not use old project-specific Vercel URLs as the primary Demo link.
- Do not add per-project Vercel production deployments.
- Use GitHub feature branches and PRs; keep `main` protected from direct implementation pushes.

## Catalog facts

- `projects-index.json` is the canonical machine-readable index.
- `docs/PROJECT_INDEX.md` is the human-readable index.
- Public demo path format: `/demos/<repo>/`.
- Catalog facets: industry/category, source, runtime and GitHub availability.
- Source groups shown by the Hub: JV integrated projects, AI industry cases and smart-manufacturing systems.

## Quality assets

- Design baseline: `design-system/jvision-464-ai-saas-demos/MASTER.md`.
- Project reviewer: `project-expert.html` and `tools/project-expert-agent.mjs`.
- Audit reports: `docs/FORMAL_SITE_AUDIT.md`, `docs/MOBILE_ANALYTICS_AUDIT.md`, and `docs/PROJECT_EXPERT_ACCEPTANCE_REPORT.md`.

