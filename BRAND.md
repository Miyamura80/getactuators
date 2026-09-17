# getactuators Brand

The getactuators visual identity is instrument-grade: it should read like a HUD,
a terminal, or a circuit-board schematic, not a consumer marketing page. The site
is a data tool for robot builders, so the design stays precise, modular, and
"always on." When a choice makes the page feel warmer, softer, or more
"designery," it is wrong.

Atmosphere keywords: monochromatic, systemic, modular, computed, blueprint.

## The mark

A rotary actuator seen end-on, drawn in thin cyan strokes on black: a circular
housing, a stator-slot ring, four mounting bolt holes on the diagonals, a hub,
and a keyed square output shaft with a rotation arc. No fill, no gradients, no
shadows. The object itself is the logo.

- Keep the geometry concentric and centered; the rotation arc reads top-right.
- The keyed shaft is the only solid cyan fill; everything else is stroked.
- It appears in the hero and the sidebar brand lockup. A compact version of the
  same actuator (`frontend/src/components/BrandGlyph.tsx`) tags each section and
  highlight-card heading, stripped down to stay legible at ~15px.
- Implemented as `frontend/src/components/BrandMark.tsx`; the tab favicon is the
  same actuator on a black tile at `frontend/public/favicon.svg`.

## Color

Black-dominant. Cyan is the single load-bearing accent and stays restrained;
if cyan starts to take over a view, pull it back.

| Role | Name | Hex | Rough share |
|------|------|-----|-------------|
| Dominant background | Baseline Black | `#000000` | ~40% |
| Secondary text, surfaces, borders | Graphene Grey | `#9ba4a6` | ~30% |
| Accent, active elements, links, focus | Core Cyan | `#c3fffd` | ~20% |
| Light text, highlights | Wavelength White | `#f9f9f9` | ~10% |

Surface and line tokens (as used in `frontend/src/index.css`):

- Panels: `#0a0a0a`, `#121212`
- Lines: `#242424`, `#383838`
- Accent tint: `#7de6e2` (dimmer cyan for large fills)

Status colors, used only for state, never as an accent:

- Circuit Green `#00c781`: verified / positive (verified rows, spot-checked note)
- Infra Red `#ff3b4d`: alert / unverified (the "verify against datasheet" note)

## Typography

- **Inter** (neo-grotesque sans) for UI and headings. No serifs, no rounded or
  humanist display faces.
- **JetBrains Mono** for numbers, telemetry-style labels, axis ticks, and IDs.
  Use tabular figures wherever digits line up in a column.
- White on black for primary text; Graphene Grey for secondary. Tight to normal
  tracking; light letter-spacing only on small uppercase labels.

## Layout

- Grid first. Align every element to it; let negative space do work.
- Square corners on containers and the mark. Inputs and buttons may use a 2px
  radius at most.
- No gradients, glows, soft shadows, or glassmorphism. Flat fills and crisp thin
  strokes only.
- Prefer many small repeated units over one large hero element.

## Data visualization

The UI chrome stays cyan and grey. Color on a chart carries meaning:

- **Provider color**, Artificial-Analysis style: each maker that appears more
  than once gets a distinct, bright-on-black color; the long tail is a single
  grey "Other". The palette lives in `frontend/src/lib/brands.ts`.
- Bars, scatter points, and the row dot in the table all encode the provider.
- Pareto-frontier points keep their provider color and gain a white ring.
- Green marks verified data; amber/red marks unverified.

Keep one scale per chart, label the values a chart actually reaches, and take
chart text color from the theme tokens so it reads on black.

## Voice

- Numbers first, precise, and honest about provenance. Every actuator shows where
  its data came from and whether it has been spot-checked.
- Never use em dashes (also enforced by the repo's writing check).
