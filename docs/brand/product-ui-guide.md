# Sydeso Product UI Guide

Version: 2.0.0
Status: Active
Owner: Product Design
Last Updated: 2026-11-09
Applies to: `apps/web` (the product at app.sydeso.com)

---

## Purpose

The marketing site sells. The product is used all day. This guide takes the marketing palette and type and turns
them into a system for daily work: quiet surfaces, compact rows, one strong colour, and chrome that gets out of the
way. The reference for density and interaction is Linear; the reference for colour, type and shape is sydeso.com.

2.0 follows the site redesign of November 2026: light by default on a warm off-white, Geist and Geist Mono, pill
buttons in ink, larger radii, and lime reduced to a small signal. Dark mode follows the viewer's system setting and
uses the site's `.theme-dark` values.

Where `docs/brand/visual-branding-guide.md` and this guide differ for product screens, this guide wins.

## Principles

- Light by default, dark by choice. The ground is `#f7f7f4`; the system setting switches to the site's dark tokens.
  Hierarchy comes from three surfaces and two line weights, not from colour.
- Ink is the strong colour. `--accent` is the theme's contrast colour (ink on light, near-white on dark): the primary
  button, done progress steps, focus.
- Lime is a signal, not a theme. It is the mark, the selection, the dot on a column waiting for a person, and (as the
  darker `--signal`) the glyph of a gate. It is never a fill behind text and never decorates.
- Sentence case, Geist, small. Product text is 13px. No mono capitals in the product.
- Rows, not cards. Lists are rows of a fixed height with a status glyph, a title and right-aligned metadata. Cards are
  for the board only.
- Nothing jumps. Motion is 140 to 180 ms and only on hover, focus and open/close.

## Colour tokens

All colours are CSS custom properties on `:root` in `apps/web/src/app/globals.css`, redefined under
`prefers-color-scheme: dark`. Components never use literal colours.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | `#f7f7f4` | `#111110` | Page ground |
| `--bg-side` | `#f0f0eb` | `#0c0c0b` | Sidebar and topbar |
| `--surface` | `#fcfcfa` | `#161615` | Panels, inputs, menus |
| `--surface-2` | `#ecece7` | `#1b1b1a` | Hover on rows and nav, group headers |
| `--surface-3` | `#e2e2dc` | `#242422` | Selected or pressed |
| `--ink` | `#141413` | `#f3f3ef` | Primary text |
| `--ink-2` | `#3d3d39` | `#c9c9c3` | Secondary text, row metadata |
| `--muted` | `#5d5d57` | `#a2a29b` | Labels, placeholders, helper text |
| `--faint` | `#8c8c85` | `#6c6c66` | Disabled text, icons at rest |
| `--line` | ink at 10% | near-white at 10% | Row dividers, panel borders |
| `--line-strong` | ink at 22% | near-white at 22% | Input borders, outline buttons |
| `--accent` | `#141413` | `#f3f3ef` | Primary button, done progress steps, focus ring |
| `--accent-ink` | `#f7f7f4` | `#111110` | Text on the accent |
| `--lime` | `#c4ff00` | `#c4ff00` | The mark, the selection, gate dots |
| `--signal` | `#4f6b00` | `#c4ff00` | Gate glyphs (lime that reads on the ground) |
| `--signal-soft` | lime at 32% | lime at 14% | Gate chips, the one-time token notice |
| `--danger` | `#c2381c` | `#ff6a4d` | Errors, escalation, destructive actions |
| `--warn` | `#9a5b00` | `#ffb02e` | Attention that is not an error |

Rules:

- A screen has at most one filled ink button. Everything else is outline or ghost.
- Status colour is always paired with a glyph or a word; colour never carries meaning alone.

## Typography

| Role | Face | Size / line | Weight | Case |
| --- | --- | --- | --- | --- |
| Body, rows, forms | Geist | 13px / 1.5 | 400 | Sentence |
| Long text (requests, document prose) | Geist | 14px / 1.6 | 400 | Sentence |
| Page title | Geist | 22px / 1.2, tracking -0.025em | 500 | Sentence |
| Section title | Geist | 13px / 1.4 | 500 | Sentence |
| Label, group header | Geist | 12px / 1.4 | 500, `--muted` | Sentence |
| Identifier, hash, code, JSON, timer | Geist Mono | 12px / 1.55 | 400 | As-is |

Rules:

- The `.mono` class is a small sentence-case label, as on the site; it is no longer monospace or capitals.
- No text is smaller than 11px.

## Spacing and shape

- Base unit 4px. Component padding 8 or 12. Section gaps 16 or 24. Page gutter 24.
- Radii: 6px keys and small marks, 8px inputs and menu items, 14px panels, rows containers and menus.
  Buttons, badges and segmented controls are pills.
- Row heights: list rows 36px, sidebar items 28px, table rows 40px, inputs and buttons 32px (28px compact).
- Borders are 1px `--line`; inputs and focused panels use `--line-strong`.
- Shadows only on floating layers (menus, popovers, dialogs): `--shadow`, the site's soft two-layer shadow.

## Shell

- Sidebar 240px, `--bg-side`, 1px `--line` on the right. Top: the lime mark and the current project as a switcher
  (chevron, opens a menu of projects grouped by organization). Then the primary ink pill "New request" and a search
  button that opens the command bar. Then grouped navigation: 28px rows, a 16px icon, label, and an optional count on
  the right. The current item has `--surface-3` background and `--ink` text. Group labels are 12px sentence case in
  `--muted`. The bottom holds the signed-in user (name, email, sign out) and the API host.
- Topbar 48px, `--bg-side`, 1px `--line` below. Left: breadcrumb in 13px Geist, separators in `--faint`. Right:
  page actions as icon buttons.
- Content area: `--bg`, 24px padding, max width 1280px for forms and detail, full width for lists and the board.
- Under 900px the sidebar collapses to a top bar with a menu button; content keeps its gutters.

## Components

### Buttons

| Variant | Fill | Border | Text | Use |
| --- | --- | --- | --- | --- |
| Primary | `--accent` (ink) | none | `--accent-ink` 500 | One per screen: New request, Sign in |
| Secondary | none | `--line-strong`, `--ink` on hover | `--ink` | Most actions, Approve and Reject |
| Ghost | none | none | `--ink-2`, `--ink` on hover | Topbar actions, icon buttons |
| Danger | `--danger-soft` | `--danger` at 40% | `--danger` | Remove, escalate, revoke |

32px tall, 12px horizontal padding, pill radius, 13px Geist 500. Hover fills `--surface-2` and darkens the border to
ink; the primary lightens to `--accent-hover`. Pressed scales to 98%. Disabled is 50% opacity. Focus is a 2px
`--accent` ring offset 2px. The site's ↗ arrow is for links that leave the product only.

### Inputs

32px tall, `--surface`, 1px `--line-strong`, 8px radius, 13px text, 10px horizontal padding. Placeholder `--muted`.
Focus swaps the border for `--accent`. Invalid swaps it for `--danger`. Labels sit above in 12px `--muted`. Textareas
are 4 rows by default. Selects keep the native control with a chevron glyph.

### Rows

A row is a 36px flex line: `[status glyph 16px] [identifier mono 11px --muted] [title 13px --ink, truncates]
[metadata right-aligned 12px --ink-2]`. Rows divide with 1px `--line`, hover `--surface-2`, selected
`--accent-soft` with a 2px `--accent` left edge. The whole row is the link.

### Tables

For data that needs columns (jobs, transitions, audit). 40px rows, 12px headers in `--muted`, 12px cell padding,
hover `--surface-2`. Numeric and date columns right-align. Wide tables scroll inside their panel.

### State chips

Geist 12px 500, sentence case, pill, 20px tall, 1px border. Workflow states use `--line-strong` and `--ink-2`;
human gates use `--signal-soft` with `--ink`; escalated uses `--danger-soft` and `--danger`; released is `--accent`
filled. Live chips carry a 6px pulsing dot before the text.

### Progress steps

A plain left-to-right line with one 20px circle per stage and the stage name below in 12px sentence case. Done
stages are filled `--accent` with a check, and the line behind them is `--accent`; the current stage is an `--accent`
ring with a gently pulsing dot; stages ahead are hollow `--line-strong` rings on a `--line-strong` line. When the
request needs a person, the stage it stopped at turns `--danger` with a "!" and "Needs you" under its name. No panel
around it. On narrow screens the line scrolls sideways.

### Panels

`--surface`, 1px `--line`, 14px radius. Header 40px with a 13px 500 title on the left and metadata on the right,
divided by 1px `--line`. Body padding 16px. Panels do not nest.

### Properties panel

Detail pages have a 280px right column: a list of `[label 12px --muted] [value]` pairs, 32px per row, for state,
run, actor, timestamps and counts, followed by the actions. On narrow screens it moves below the main column.

### Board

Columns of 260px minimum, 1px `--line` between them, a 36px header with the state chip and the count. Cards are
`--surface`, 1px `--line`, 6px radius, 10px padding: title 13px 500, then identifier and relative time in 12px
`--muted`. Hover lifts to `--surface-2`.

### Notices

Inline, 12px padding, 6px radius. Info: `--surface-2` with `--line-strong`. Error: `--danger-soft` with a 1px
`--danger` border at 40% and `--danger` text. No left accent bars.

### Menus and the command bar

Floating `--surface`, 1px `--line-strong`, 8px radius, shadow. Items 32px with a 16px icon, label and an optional
key on the right. The command bar is the same list under a 40px search input, opened with ⌘K or the search button.

### Empty states

A row-height line of `--muted` text with one link, inside the list's container. No dashed boxes.

### Keys

Keyboard shortcuts are shown as 20px keys on `--surface-2` with a 6px radius, in tooltips and menus.

## Motion

- Hover and focus: 140 ms, colour only; a pressed button scales to 98%.
- Menus, popovers, the command bar: 180 ms fade and 4px rise.
- Page transitions: none.
- Respect `prefers-reduced-motion`: pulses stop, rises become fades.

## Accessibility

- Text contrast is at least 4.5:1 on every surface; `--muted` on `--bg` is 4.6:1.
- Every interactive element has a visible focus ring.
- Rows are links or buttons, never divs with click handlers.
- Icons that carry meaning have text beside them or an accessible name.

## Enforcement

- New components take their colours, type and spacing from the tokens above; a literal colour in a component is a
  review blocker.
- A pull request that adds an uppercase label explains why in its description.
- The design-lock generator and generated project guides stay separate from this guide; they describe a client's
  product, not Sydeso's.
