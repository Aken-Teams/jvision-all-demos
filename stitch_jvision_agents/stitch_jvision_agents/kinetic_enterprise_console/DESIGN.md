---
name: Kinetic Enterprise Console
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#444653'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#440098'
  on-tertiary: '#ffffff'
  tertiary-container: '#5f00d1'
  on-tertiary-container: '#c9aeff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  kpi-display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  eyebrow-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-status:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  margin: 24px
---

## Brand & Style
This design system is engineered for high-stakes enterprise orchestration. The aesthetic combines the precision of a modern developer tool with the robust credibility of a financial ERP. The primary objective is to make complex, multi-agent AI workflows feel manageable and stable.

The style is **Corporate Modern with a "Glass-Precision" influence**. It utilizes a clean, bright white environment, high-contrast typography, and a "data-first" hierarchy. While the interface is dense, it maintains a sense of calm through a rigorous 8pt grid and a disciplined color application. The "AI Layer" is distinguished by subtle violet accents, signaling a transition from standard SaaS functionality to intelligent agent orchestration.

## Colors
The palette is dominated by **Professional Blues** and **Slates**. 
- **Action & Navigation:** Use `#1E40AF` (Deep Blue) for primary navigation states and `#3B82F6` (Bright Blue) for active interactive elements and primary buttons.
- **Surface Strategy:** The main workspace is pure `#FFFFFF`. Use `#F5F8FC` (Light Blue-Grey) for sidebars, secondary panels, and grouping containers to create clear structural contrast.
- **The AI Layer:** `#7C3AED` (Violet) is reserved exclusively for AI entities, agent avatars, and orchestration logic.
- **Attention Management:** `#D97706` (Amber) is used with high intentionality for "Human-in-the-loop" triggers and items requiring immediate review.
- **Typography:** Primary text is `#1E293B` (Slate). Supporting metadata and secondary labels use `#64748B`.

## Typography
The system uses **Inter** for all Latin characters and **Noto Sans TC** for Traditional Chinese copy to ensure maximum legibility at high data densities.

- **KPIs:** Large, bold numbers for mission-critical metrics.
- **Eyebrows:** All Latin section headers (e.g., "MISSION CONTROL") must be uppercase, bold, and tracked out (+8%) at 11px to serve as structural anchors.
- **Body Copy:** Standardize on 14px for general interface text to maximize information density without sacrificing readability.
- **Language Balance:** Ensure line-heights are generous enough (min 1.5x) to accommodate the visual complexity of Traditional Chinese characters.

## Layout & Spacing
This is a **Desktop-First** fluid grid system built on an **8pt rhythm**.

- **Grid:** Use a 12-column grid for main content areas with 20px gutters. 
- **Density:** Components should prioritize vertical compactness. Use `8px` (sm) for internal element spacing and `16px` (md) for grouping related items.
- **Sidebar:** Fixed width at 240px or 280px depending on navigation depth, utilizing the subtle blue-grey background.
- **Orchestration View:** A specialized canvas layout for agent mapping. Use a dot-grid background (8px intervals) to suggest a technical workspace.

## Elevation & Depth
The system uses **Tonal Layering** combined with soft, technical shadows to define hierarchy.

- **Level 0 (Surface):** Main background `#FFFFFF`.
- **Level 1 (Cards/Panels):** Raised using a hairline border `#E2E8F0` and a very subtle shadow: `0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)`.
- **Level 2 (Active/Floating):** Used for tooltips and dropdown menus. Elevated with a more pronounced but soft shadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1)`.
- **Orchestration Links:** Agent connections are rendered as thin, curved SVG paths in `#CBD5E1`. On hover or active state, these glow with a `#7C3AED` stroke.

## Shapes
The shape language balances approachability with professional structure.

- **Cards & Large Containers:** 12px corner radius for a modern, "contained" feel.
- **Interactive Controls:** Buttons, inputs, and tabs use an 8px radius to feel precise and mechanical.
- **Agent Avatars:** Strictly circular (50% radius).
- **Status Dots:** Small 8px circles positioned at the bottom-right of avatars or preceding status text.

## Components
- **Buttons:** 
  - *Primary:* Solid `#3B82F6` with white text.
  - *Secondary:* Ghost style with `#1E293B` text and `#E2E8F0` border.
- **Agent Avatars:** Circular images or initials with a 2px offset ring in `#7C3AED`. Include a status dot:
  - **執行中 (Active):** `#16A34A`
  - **待命 (Idle):** `#94A3B8`
  - **待審核 (Pending):** `#D97706`
- **Input Fields:** 8px radius, white background, `#E2E8F0` border. On focus, use a 2px `#3B82F6` ring.
- **Data Tables:** Hairline horizontal dividers only. Row hover state uses `#F5F8FC`. Header text uses `eyebrow-caps` style.
- **AI Badges:** Small pills with `#7C3AED` background at 10% opacity and solid `#7C3AED` text for marking AI-generated content or agent-controlled fields.
- **Orchestration Links:** Thin curved lines connecting agent nodes, representing data flow or command logic.