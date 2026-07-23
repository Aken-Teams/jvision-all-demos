# Project Expert Agent｜Page Override

This page inherits the JVision 464 AI SaaS Demos Master design system. It uses the same navy/blue enterprise palette rather than the generated purple/pink alternative, because the Master file is the established product source of truth.

## Purpose

An internal quality-assurance dashboard for reviewing 464 industry SaaS demos. It must feel authoritative, explain why a recommendation exists, and clearly separate safe automation from decisions requiring a domain owner.

## Page Rules

- Use a bright `#F8FAFC` canvas, white surfaces, navy text and blue data accents.
- Keep one primary action: return to the Demo Hub. The command-copy action is secondary.
- Present score, status and priority using both label text and color.
- Use cards for mobile review rows; avoid a wide desktop table on phone.
- Controls and review actions need a 44px minimum touch height and an 8px minimum gap.
- Provide a visible skip link, live regions for dynamically updated counts, and focus-visible states.
- Motion is limited to 150–250ms color/shadow/transform feedback and disabled under `prefers-reduced-motion`.

## Review Information Hierarchy

1. Agent policy and review totals
2. Filter controls and visible-result count
3. Project score and top recommended action
4. Expandable evidence, required capabilities and full recommendation list

## Avoid

- Do not use emoji as status icons.
- Do not represent priority by color alone.
- Do not expose a button labelled “auto fix” on the static page; safe modifications run through the audited CLI workflow.
