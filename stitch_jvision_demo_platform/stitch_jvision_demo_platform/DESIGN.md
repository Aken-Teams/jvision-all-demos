---
name: Professional Enterprise Interface
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
  tertiary: '#532a00'
  on-tertiary: '#ffffff'
  tertiary-container: '#743d00'
  on-tertiary-container: '#ffa85d'
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
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  kpi-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Noto Sans TC
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Noto Sans TC
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-eyebrow:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.06em
  data-table:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
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
  xl: 48px
  container-margin: 32px
  gutter: 16px
---

## Brand & Style

The design system is engineered for high-stakes B2B enterprise environments where data density and clarity are paramount. The aesthetic merges the streamlined efficiency of modern developer tools with the robust reliability of top-tier ERP systems. 

The visual language follows a **Modern Corporate** style: 
- **High-Fidelity:** Every pixel serves a functional purpose. 
- **Data-Dense yet Calm:** Information is packed tightly but organized through a rigorous 8pt grid and intentional whitespace to prevent cognitive overload.
- **Credible & Authoritative:** Uses a palette of deep blues and slate to instill trust, punctuated by high-contrast action colors.
- **Traditional Chinese Optimization:** Layouts and line heights are specifically tuned to handle the visual complexity of Traditional Chinese characters, ensuring legibility at smaller scales.

## Colors

This design system uses a strict hierarchical color application to guide the user's eye through complex workflows.

- **Action Palette:** Use `#1E40AF` (Deep Blue) for primary buttons and high-level navigation. Use `#3B82F6` (Bright Blue) for interactive states, links, and active selection indicators.
- **Surface Strategy:** The primary workspace is `#FFFFFF` (Pure White). Use `#F5F8FC` (Light Blue-Grey) to differentiate sidebar regions, table headers, and secondary containers.
- **Typography:** Primary data and labels use `#1E293B`. Use `#64748B` for helper text and secondary metadata.
- **Attention & Status:** The Amber color (`#D97706`) is reserved strictly for "Needs Attention" states or critical secondary CTAs. Success and Danger colors are used for semantic status indicators only.
- **Borders:** Use `#E2E8F0` for hairline dividers and component strokes to maintain a clean, structured appearance.

## Typography

The typography system prioritizes bilingual harmony and data legibility.

- **Display Numbers (KPIs):** Use **Inter** Bold for large numerical displays. These should be high-impact and use tighter letter spacing.
- **Body & Content:** **Noto Sans TC** is the primary typeface for all Chinese UI copy, providing a balanced weight that remains clear in data-heavy tables.
- **Eyebrow Labels:** Use **Inter** in All-Caps for section headers and small labels. These provide structural "signposts" without adding visual bulk.
- **Hierarchy:** Maintain a clear distinction between the "Label" and the "Value." Values should generally be one weight heavier than their labels.

## Layout & Spacing

This design system utilizes a **12-column fluid grid** for the main content area, anchored by a fixed-top navigation bar.

- **Rhythm:** All spacing—padding, margins, and component heights—must be multiples of 8px (the "Base"). 4px (XS) may be used for tight component internals.
- **Grid:** Use a 12-column system for desktop screens (1440px+). Gutter width is fixed at 16px to maintain density, while margins are set at 32px for breathing room at the edges.
- **Adaptive Strategy:** 
  - **Desktop:** 12 columns, 32px margins.
  - **Tablet:** 8 columns, 24px margins.
  - **Mobile:** 4 columns, 16px margins.
- **Navigation:** The top bar is fixed at 64px height. Global search should be centrally positioned or right-aligned for quick access.

## Elevation & Depth

To maintain a "Clean & Bright" feel, depth is communicated through subtle tonal changes and soft, atmospheric shadows rather than heavy blurs.

- **Tonal Layering:** The primary background is white. Secondary areas (sidebars, tables) use the light blue-grey surface to create a natural "recessed" look.
- **Card Shadows:** Use a very soft, multi-layered shadow for primary cards. 
  - *Example:* `0px 2px 4px rgba(30, 41, 59, 0.04), 0px 8px 16px rgba(30, 41, 59, 0.08)`.
- **Interactive States:** On hover, cards should slightly lift (increase shadow spread) or gain a primary-colored border stroke (1px) to indicate focus.
- **Hairlines:** Use `#E2E8F0` for all internal dividers within cards and tables to keep the interface feeling precise and light.

## Shapes

The shape language balances modern software aesthetics with professional rigor.

- **Cards & Containers:** All primary data containers and dashboard widgets use a **12px** corner radius. This softens the high-density layout and creates a "modern SaaS" feel.
- **Form Controls & Buttons:** Buttons, input fields, and dropdowns use an **8px** corner radius. This distinction helps users mentally separate "content containers" from "interactive elements."
- **Small Components:** Chips, tags, and status indicators should use a fully rounded (pill) shape to distinguish them from actionable buttons.

## Components

- **Buttons:** 
  - *Primary:* Solid Deep Blue (`#1E40AF`) with white text. 
  - *Secondary:* Ghost style with Slate (`#1E293B`) text and Hairline border.
  - *CTA/Highlight:* Solid Amber (`#D97706`) for specific "Attention" actions.
- **Data Tables:** Use a 40px row height for density. Headers use the Light Blue-Grey background (`#F5F8FC`) with All-Caps eyebrow labels. Text is aligned top-left for Chinese readability.
- **KPI Widgets:** Features a large bold Inter number, a small "eyebrow" label above, and a trend indicator (Success Green or Danger Red) below.
- **Input Fields:** 8px radius, white background, hairline border. On focus, use a 2px outer glow of Bright Blue (`#3B82F6`) with 20% opacity.
- **Navigation Bar:** Fixed white background with a subtle bottom border. Global search should be an inset field with a light grey background to differentiate it from the white header.
- **Chips/Status:** Use low-saturation background tints of the status colors (e.g., light green background with dark green text) for subtle but clear status communication.