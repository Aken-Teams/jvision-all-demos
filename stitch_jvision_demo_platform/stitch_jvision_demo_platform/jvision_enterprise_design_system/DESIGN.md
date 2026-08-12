---
name: JVision Enterprise Design System
colors:
  surface: '#fbf8ff'
  surface-dim: '#dad9e3'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2fc'
  surface-container: '#eeedf7'
  surface-container-high: '#e8e7f1'
  surface-container-highest: '#e3e1eb'
  on-surface: '#1a1b22'
  on-surface-variant: '#444653'
  inverse-surface: '#2f3037'
  inverse-on-surface: '#f1f0fa'
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
  tertiary: '#611e00'
  on-tertiary: '#ffffff'
  tertiary-container: '#872d00'
  on-tertiary-container: '#ffa583'
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
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb59a'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#802a00'
  background: '#fbf8ff'
  on-background: '#1a1b22'
  surface-variant: '#e3e1eb'
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
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max-width: 1440px
  gutter: 24px
  margin-page: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

The design system is engineered for high-stakes B2B enterprise environments where clarity, speed of data ingestion, and professional trust are paramount. It follows a **Modern Corporate** aesthetic with a **Linear ERP** influence—emphasizing structure and precision without the clutter of legacy systems.

The visual language is characterized by:
- **Cleanliness:** High-contrast interfaces using a predominantly white and light-blue-grey foundation to reduce cognitive load.
- **Calmness:** A systematic approach to whitespace that prevents data density from feeling overwhelming.
- **Authority:** A sophisticated blue-centric palette that signals stability and technical competence.
- **Precision:** Hairline borders and geometric alignment that reflect the accuracy of the underlying data.

## Colors

The color palette is architected for a professional "SaaS Console" experience. 

- **Primary & Secondary Blues:** Used for brand presence, primary actions, and active navigation states. The deep blue (#1E40AF) provides grounding, while the brighter blue (#3B82F6) highlights interactive elements.
- **Neutrals:** The background uses #FFFFFF for primary content cards and #F5F8FC for page scaffolding to create subtle depth. Text follows a strict hierarchy using Slate #1E293B for maximum readability.
- **Accents:** Warm Amber (#D97706) is reserved strictly for high-priority calls to action or states requiring immediate user attention, ensuring they pop against the cool-toned interface.
- **System States:** Standardized Success and Danger colors are utilized for status indicators and destructive actions respectively.

## Typography

The typography system utilizes **Inter** for its geometric clarity and excellent legibility in data-heavy contexts.

- **Traditional Chinese Support:** When rendering Chinese characters, ensure the font stack falls back to high-quality system sans-serifs (e.g., Microsoft JhengHei) while maintaining the Inter spacing metrics for Latin alphanumeric characters.
- **KPI Emphasis:** Use `kpi-display` for hero numbers on dashboards. These should be bold and prominent to allow for quick scanning of platform health.
- **Information Architecture:** Utilize `eyebrow-caps` for section labels above headers. These should be set in secondary text colors to provide context without competing with headlines.
- **Readability:** The base body size is set to 14px (`body-md`) to balance data density with legibility.

## Layout & Spacing

This design system employs a **Desktop-first, Fixed-width Grid** approach for the main console area to ensure complex data tables and charts remain performant and predictable.

- **Grid System:** A 12-column grid with 24px gutters. Content is typically housed within cards that span 3, 4, 6, or 12 columns.
- **8-pt Rhythm:** All spatial dimensions (padding, margins, heights) must be multiples of 8px to maintain visual harmony.
- **The Top Bar:** A fixed 64px height header. 
    - **Left:** Branding and Workspace switcher.
    - **Center:** Expanded global search bar (max-width 600px).
    - **Right:** Utility icons (Notifications, Help) and the User Profile avatar.
- **Page Layout:** Background set to `#F5F8FC`. Primary content is wrapped in `#FFFFFF` cards with 32px page margins.

## Elevation & Depth

To maintain a "Clean & Bright" aesthetic, elevation is handled through **Tonal Layering** and **Soft Ambient Shadows**.

- **Level 0 (Floor):** The `#F5F8FC` page background.
- **Level 1 (Card):** White surfaces with a 1px border of `#E2E8F0`. 
- **Shadows:** Use a very soft, diffused shadow for primary cards: `0px 4px 12px rgba(30, 41, 59, 0.05)`. This creates a subtle lift from the background without feeling heavy or skeuomorphic.
- **Interactions:** Elements like dropdowns or active modals use a slightly more pronounced shadow `0px 8px 24px rgba(30, 41, 59, 0.08)` to indicate temporary overlay status.
- **Hairline Dividers:** Use 1px solid lines in `#E2E8F0` to separate content *within* a single elevation level (e.g., table rows or list items).

## Shapes

The shape language balances modern softness with professional structure.

- **Containers & Cards:** Use a consistent `12px` (rounded-lg) corner radius. This softens the "industrial" feel of the ERP aesthetic and makes the UI feel approachable.
- **Controls & Inputs:** Buttons, text fields, and select menus use an `8px` (standard) corner radius. This provides a clear visual distinction between structural containers and interactive components.
- **Small Elements:** Tooltips and tags/badges use a `4px` (rounded-sm) radius to maintain crispness at small scales.

## Components

- **Buttons:** 
    - *Primary:* Blue background (#1E40AF), white text, 8px radius. 
    - *Secondary:* White background, blue border, blue text.
    - *Accent:* Amber background (#D97706) for high-conversion CTAs.
- **Input Fields:** 8px radius, `#E2E8F0` border. Active state uses a 1px `#3B82F6` border with a soft blue outer glow.
- **Cards:** 12px radius, white background, soft 0.05 opacity shadow, and 24px internal padding.
- **Data Tables:** High-density, 40px row height. Header row uses `#F8FAFC` background and `eyebrow-caps` typography. Rows use hairline bottom borders.
- **Status Badges:** Pill-shaped with low-saturation backgrounds and high-saturation text (e.g., Success: Light green bg, dark green text).
- **Navigation:** Vertical sidebar with 240px width or horizontal top-nav. Active items marked by a 3px left/bottom "indicator bar" in Primary Blue.
- **Search Bar:** Centrally located in the top bar, featuring a subtle inset shadow and magnifying glass icon to signal global functionality.