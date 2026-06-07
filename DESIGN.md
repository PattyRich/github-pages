---
name: Praynr OSRS Community Toolbox
description: Task-focused tools for OSRS community events, simulators, and service status.
colors:
  page-brown-dark: "#2b261e"
  surface-brown: "#3c3224"
  inventory-brown: "#463d32"
  border-dark: "#1d1813"
  border-light: "#5d503f"
  text-gold: "#ff981f"
  text-yellow: "#ffff00"
  text-normal: "#dbceb4"
  text-beige: "#f7e6c1"
  button-bg: "#5a4c37"
  button-hover: "#483d2c"
  button-active: "#362d20"
  success-bg: "#24461a"
  danger-bg: "#5c1b1b"
  warning-bg: "#634316"
  info-bg: "#24364e"
typography:
  display:
    fontFamily: "osrsFont, sans-serif"
    fontSize: "2.2rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0"
  headline:
    fontFamily: "osrsFont, sans-serif"
    fontSize: "1.4rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  label:
    fontFamily: "osrsFont, sans-serif"
    fontSize: "0.88rem"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "0"
rounded:
  none: "0"
  sm: ".375rem"
  md: "8px"
  pill: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "10px"
  lg: "16px"
  xl: "20px"
  page-x: "1.5rem"
  page-y: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.button-bg}"
    textColor: "{colors.text-normal}"
    rounded: "{rounded.sm}"
    padding: "0.375rem 0.75rem"
  button-primary-hover:
    backgroundColor: "{colors.button-hover}"
    textColor: "{colors.text-gold}"
    rounded: "{rounded.sm}"
    padding: "0.375rem 0.75rem"
  button-success:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.text-normal}"
    rounded: "{rounded.sm}"
    padding: "0.375rem 0.75rem"
  button-danger:
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.text-normal}"
    rounded: "{rounded.sm}"
    padding: "0.375rem 0.75rem"
  panel-raised:
    backgroundColor: "{colors.surface-brown}"
    textColor: "{colors.text-normal}"
    rounded: "{rounded.md}"
    padding: "18px"
  field:
    backgroundColor: "{colors.page-brown-dark}"
    textColor: "{colors.text-beige}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
---

# Design System: Praynr OSRS Community Toolbox

## 1. Overview

**Creative North Star: "The Bank Booth Workbench"**

Praynr should feel like a practical Old School RuneScape tool laid out on a familiar bank interface: compact, tactile, brown-and-gold, and built for repeat use during community events. The design serves the task first. Flavor comes from the OSRS font, inventory colors, item imagery, inset borders, and clear state changes.

The product is a toolbox, not a marketing site. New screens should open directly into the useful experience, keep controls close to the thing they affect, and avoid decorative panels that do not help scanning, comparison, or action.

**Key Characteristics:**
- Tactile OSRS surfaces with dark brown panels, gold headings, beige body text, and yellow in-game emphasis.
- Compact product layouts with predictable grids, short labels, and stable dimensions.
- Shared theme tokens in `apps/frontend/src/index.css` are the source of truth.
- Component CSS stays close to the component or route unless the pattern is truly global.

## 2. Colors

The palette is a warm OSRS inventory palette: dark brown surfaces, black-brown borders, parchment text, gold action emphasis, and restrained state colors.

### Primary
- **Quest Gold** (`text-gold`): Use for headings, primary hover states, important actions, selected knobs, and OSRS display accents. It should be noticeable because it is scarce.
- **Clue Yellow** (`text-yellow`): Use for in-game emphasis, tile labels, progress badges, and pet preview text. Do not use it for long body copy.

### Secondary
- **Success Moss** (`success-bg`): Use for completed states, success buttons, checked switches, and tile progress.
- **Danger Maroon** (`danger-bg`): Use for destructive actions, danger alerts, and irreversible warnings.
- **Warning Amber Brown** (`warning-bg`): Use for caution states where danger would be too strong.
- **Status Blue Slate** (`info-bg`): Use only for informational alerts or system status context.

### Neutral
- **Page Brown Dark** (`page-brown-dark`): Base body background and recessed input surface.
- **Panel Brown** (`surface-brown`): Raised sections, tool panels, and headers.
- **Inventory Brown** (`inventory-brown`): Default tile and modal surface.
- **Hard Border** (`border-dark`): Outer strokes, separations, modal dividers, and control borders.
- **Lit Border** (`border-light`): Inset highlight that gives panels and controls their OSRS bevel.
- **Parchment Text** (`text-beige`): High-emphasis readable text on dark surfaces.
- **Muted Parchment** (`text-normal`): Default text and button labels.

### Named Rules

**The Gold Is Earned Rule.** Gold marks headings, focus, active intent, and selected state. Do not spread it across decorative dividers, random icons, or inactive labels.

**The Brown Surface Ladder Rule.** Use `page-brown-dark` for the page, `inventory-brown` for tiles and inputs, and `surface-brown` for raised panels. Do not introduce a second unrelated neutral palette.

**The No Frost Rule.** Existing glass surfaces are dark amber overlays. Do not add white frosted glass, blue glass, or generic blur cards.

## 3. Typography

**Display Font:** `osrsFont` with sans-serif fallback.
**Body Font:** System sans stack.
**Label/Mono Font:** No separate mono style; use the body stack for code only.

**Character:** OSRS font is the product's voice, so it belongs on headings, buttons, modal titles, tile overlays, and small action labels. Body copy stays in the system font so forms, status data, and longer explanations remain easy to read.

### Hierarchy
- **Display** (500, `2.2rem`, 1.2): Main page titles and large route headings. Use sparingly.
- **Headline** (500, `1.4rem`, 1.2): Section titles, modal headings, and important panel labels.
- **Title** (500, `1rem` to `1.05rem`, 1.2): Card titles, route names, and compact panel headings.
- **Body** (400, `1rem`, 1.5): Paragraphs, field help, status details, and descriptive text. Keep prose near 65-75 characters per line.
- **Label** (400, `0.78rem` to `0.92rem`, 1.35): Buttons, chips, tile metadata, badges, and compact UI labels.

### Named Rules

**The OSRS Font Boundary Rule.** Use `osrsFont` for identity and controls, not for dense paragraphs, JSON, tables, or error detail.

**The No New Tracking Rule.** Do not add new letter spacing. Preserve existing isolated cases only when touching unrelated code.

## 4. Elevation

Depth is conveyed through OSRS bevels first: a dark 2px border, a 1px inset light border, tonal surface changes, and only then ambient shadow. Shadows support panels and hover states; they are not the main design language.

### Shadow Vocabulary
- **Inset Bevel** (`inset 0 0 0 1px var(--osrs-border-light)`): Required on OSRS buttons, panels, cards, toasts, switches, and modal surfaces.
- **Glass Panel Shadow** (`0 6px 24px rgba(0, 0, 0, 0.55)`): Use on raised panels, modal surfaces, alerts, and toast containers.
- **Hover Lift** (`0 8px 28px rgba(0, 0, 0, 0.65)`): Use only for interactive cards or panels that clearly navigate or open something.
- **Recessed Input Shadow** (`inset 1px 1px 3px rgba(0, 0, 0, 0.7)`): Use for text inputs and selects.

### Named Rules

**The Bevel Before Shadow Rule.** If a surface feels flat, add or fix the OSRS border and inset highlight before adding a larger shadow.

**The Glass Has Weight Rule.** Glass panels must keep dark amber backgrounds, dark borders, and real readability. Blur alone is not a surface.

## 5. Components

### Buttons
- **Shape:** Slightly rounded OSRS rectangle (`.375rem`) with a 2px dark border and 1px inset light border.
- **Primary:** `button-bg` background, `text-normal` text, `osrsFont`, black text shadow, and `0.375rem 0.75rem` padding.
- **Hover / Focus:** Hover darkens to `button-hover` and turns text gold. Focus uses a 2px `border-light` outline with 2px offset.
- **Success / Danger / Warning:** Keep the same shape and typography. Change only the background token.
- **Small:** Use `4px 12px` padding and `0.78rem` type for compact toolbars.

### Cards / Containers
- **Corner Style:** Use `8px` for panels and route cards. Use `20px` only for small floating feedback pills.
- **Background:** Use dark amber glass variables for raised cards and panels. Use `inventory-brown` for tile surfaces.
- **Shadow Strategy:** Inset bevel always. Ambient shadow only for raised panels and interactive hover.
- **Border:** 2px dark outer border plus inset light border for OSRS surfaces.
- **Internal Padding:** Use `16px` to `20px` for panels, `10px` to `14px` for compact cards, and smaller values only inside tiles.

### Inputs / Fields
- **Style:** Recessed dark background (`page-brown-dark`), beige text, dark border, small radius, and inset shadow.
- **Focus:** Use a clear `border-light` outline. Do not rely on color change alone.
- **Disabled:** Use muted brown backgrounds and `text-normal` or disabled text tokens. Disabled controls must not look clickable.
- **Checkboxes / Switches:** Square or nearly square OSRS controls with dark borders. Checked state uses `success-bg` and gold where appropriate.

### Alerts / Toasts
- **Style:** Dark raised panel, inset bevel, compact body copy, and variant-specific header or border tint.
- **Placement:** Alert banners can be fixed near the top center. Toasts can use fixed corners or centers through existing positional classes.
- **Motion:** Use short entrance motion around 140-180 ms with `cubic-bezier(0.22, 1, 0.36, 1)`.

### Modals
- **Backdrop:** Dark scrim with centered modal panel.
- **Panel:** Raised OSRS glass panel, max height constrained to the viewport, scrollable body, and fixed header/footer.
- **Close Control:** Minimal text/icon button with gold hover state.
- **Mobile:** Preserve comfortable side padding and keep the panel within `100dvh`.

### Bingo Tiles
- **Shape:** Fixed square cells with OSRS bevels and stable dimensions.
- **Content:** Item image behind the text, title overlay above, progress badge at the bottom right.
- **State:** Completed progress uses green vertical fill. Hover uses a subtle light overlay. Focus must be visible inside the tile bounds.

### Navigation / Route Cards
- **Style:** Route cards are compact, readable links, not marketing cards.
- **Default:** Brown glass panel with gold title and muted parchment description.
- **Premium:** Red-to-black treatment is reserved for special featured routes. Do not apply it broadly.

## 6. Do's and Don'ts

### Do:
- **Do** read this file before changing frontend UI.
- **Do** use existing CSS custom properties in `apps/frontend/src/index.css` before adding raw colors.
- **Do** add new shared visual tokens to `index.css` when a value will recur across routes or components.
- **Do** keep OSRS flavor in borders, item imagery, font usage, and state treatment rather than decorative clutter.
- **Do** keep layouts task-first: controls near their target, stable board/tile dimensions, and compact scanning paths.
- **Do** implement hover, focus-visible, active, disabled, and loading states for new reusable components.
- **Do** keep complex route-specific behavior in route CSS, and reusable UI primitives in `apps/frontend/src/components/ui`.

### Don't:
- **Don't** replace the existing style system with Tailwind utilities or another library without an explicit migration plan.
- **Don't** introduce generic SaaS hero layouts, decorative gradient orbs, purple-blue marketing gradients, or stock-like atmosphere images.
- **Don't** use white frosted glass, neon cyberpunk accents, or unrelated neutral palettes.
- **Don't** use `osrsFont` for dense body copy, code, JSON, tables, or long status text.
- **Don't** add nested cards. If a panel contains repeated items, make the repeated items simple rows or tiles.
- **Don't** create new one-off raw hex values in component files when an existing token fits.
- **Don't** let text overlap controls, tiles, badges, images, or the next section. Use stable dimensions and responsive constraints.
