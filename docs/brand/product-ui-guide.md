# Sydeso Product UI Guide

Version: 1.0.0
Status: Active
Owner: Product Design
Last Updated: 2026-10-26
Applies to: `apps/web` (the product at app.sydeso.com)

---

## Purpose

The marketing site sells. The product is used all day. This guide takes the marketing palette and type and turns
them into a system for daily work: quiet surfaces, compact rows, one accent used sparingly, and chrome that gets out
of the way. The reference for density and interaction is Linear; the reference for colour and type is sydeso.com.

Where `docs/brand/visual-branding-guide.md` and this guide differ for product screens, this guide wins.

## Principles

- One black, many greys. The ground is near-black; hierarchy comes from four lifted surfaces and two line weights,
  not from colour.
- Lime is a signal, not a theme. It marks the primary action, the focused control, the current location and live
  state. It is never a background for text blocks and never decorates.
- Sentence case, Archivo, small. Product text is 13px. Uppercase mono is reserved for the few places it carries
  information: identifiers, hashes, keyboard keys and state chips.
- Rows, not cards. Lists are rows of a fixed height with a status glyph, a title and right-aligned metadata. Cards are
  for the board only.
- Edges are straight. The chamfered corner is the marketing site's. The product uses small, consistent radii.
- Nothing jumps. Motion is 120 to 160 ms and only on hover, focus and open/close.

## Colour tokens

All colours are CSS custom properties on `:root` in `apps/web/src/app/globals.css`. Components never use literal
colours.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#0a0a0a` | Page ground |
| `--bg-side` | `#0d0d0d` | Sidebar and topbar |
| `--surface` | `#121212` | Panels, inputs, menus |
| `--surface-2` | `#181818` | Hover on rows and nav |
| `--surface-3` | `#202020` | Selected or pressed |
| `--ink` | `#ededea` | Primary text |
| `--ink-2` | `#b6b6b0` | Secondary text, row metadata |
| `--muted` | `#86867f` | Labels, placeholders, helper text |
| `--faint` | `#5a5a55` | Disabled text, icons at rest |
| `--line` | `rgba(237, 237, 234, 0.08)` | Row dividers, panel borders |
| `--line-strong` | `rgba(237, 237, 234, 0.16)` | Input borders, focused panels |
| `--accent` | `#c4ff00` | Primary button, focus ring, current nav, live state |
| `--accent-ink` | `#0a0a0a` | Text on the accent |
| `--accent-soft` | `rgba(196, 255, 0, 0.12)` | Selected rows, accent chips |
| `--danger` | `#ff4a2a` | Errors, escalation, destructive actions |
| `--danger-soft` | `rgba(255, 74, 42, 0.14)` | Error notices, danger chips |
| `--warn` | `#ffb02e` | Attention that is not an error: pending review, stale runner |
| `--warn-soft` | `rgba(255, 176, 46, 0.14)` | Warn chips |

Rules:

- Lime text on a dark surface is for links in their hover state, the current nav item and live indicators only.
  Body copy is never lime.
- A screen has at most one filled lime button. Everything else is ghost or outline.
- Status colour is always paired with a glyph or a word; colour never carries meaning alone.

## Typography

| Role | Face | Size / line | Weight | Case |
| --- | --- | --- | --- | --- |
| Body, rows, forms | Archivo | 13px / 1.5 | 400 | Sentence |
| Long text (descriptions, artifact prose) | Archivo | 14px / 1.6 | 400 | Sentence |
| Page title | Archivo | 18px / 1.25 | 600 | Sentence |
| Section title | Archivo | 13px / 1.4 | 600 | Sentence |
| Table header, field label | Archivo | 12px / 1.4 | 500, `--muted` | Sentence |
| Identifier, hash, key, state chip | Azeret Mono | 11px / 1 | 500, tracking 0.04em | Upper for chips and keys, as-is for IDs |
| Code, JSON | Azeret Mono | 12px / 1.55 | 400 | As-is |

Rules:

- Archivo is used at its normal width in the product. The stretched display cut (`font-stretch: 125%`, uppercase) is
  reserved for the wordmark in the sidebar and the sign-in page.
- Mono caps appear in four places: state and status chips, keyboard shortcut keys, the actor type on audit rows, and
  the sidebar section labels. Nowhere else.
- No text is smaller than 11px.

## Spacing and shape

- Base unit 4px. Component padding 8 or 12. Section gaps 16 or 24. Page gutter 24.
- Radii: 4px chips and keys, 6px buttons and inputs, 8px panels and menus. Nothing larger.
- Row heights: list rows 36px, sidebar items 28px, table rows 40px, inputs and buttons 32px (28px compact).
- Borders are 1px `--line`; inputs and focused panels use `--line-strong`.
- Shadows only on floating layers (menus, popovers, dialogs): `0 8px 24px rgba(0, 0, 0, 0.5)`.

## Shell

- Sidebar 240px, `--bg-side`, 1px `--line` on the right. Top: the mark and the organization name as a switcher
  (chevron, opens a menu of organizations). Then a primary button "New feature" and a search button that opens the
  command bar. Then grouped navigation: 28px rows, a 16px icon, label, and an optional count on the right. The current
  item has `--surface-3` background and `--ink` text; nothing else is lime. Group labels are 11px mono caps in
  `--muted`. The bottom holds the signed-in user (name, email, sign out) and the API host.
- Topbar 44px, `--bg-side`, 1px `--line` below. Left: breadcrumb in 13px Archivo, separators in `--faint`. Right:
  page actions as 28px ghost buttons.
- Content area: `--bg`, 24px padding, max width 1280px for forms and detail, full width for lists and the board.
- Under 900px the sidebar collapses to a top bar with a menu button; content keeps its gutters.

## Components

### Buttons

| Variant | Fill | Border | Text | Use |
| --- | --- | --- | --- | --- |
| Primary | `--accent` | none | `--accent-ink` 500 | One per screen: create, approve |
| Secondary | `--surface-2` | `--line-strong` | `--ink` | Most actions |
| Ghost | none | none | `--ink-2`, `--ink` on hover | Topbar actions, icon buttons |
| Danger | `--danger-soft` | `--danger` at 40% | `--danger` | Remove, escalate, revoke |

32px tall, 12px horizontal padding, 6px radius, 13px Archivo 500. Hover lifts the fill one step (`--surface-2` to
`--surface-3`; the primary darkens 6%). Disabled is 50% opacity. Focus is a 2px `--accent` ring offset 2px.

### Inputs

32px tall, `--surface`, 1px `--line-strong`, 6px radius, 13px text, 10px horizontal padding. Placeholder `--muted`.
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

Mono caps 11px, 4px radius, 2px 6px padding, 1px border. Workflow states use `--line-strong` and `--ink-2`;
human gates use `--accent-soft` and `--accent`; escalated uses `--danger-soft` and `--danger`; released uses
`--accent` filled. Live chips carry a 6px pulsing dot before the text.

### Panels

`--surface`, 1px `--line`, 8px radius. Header 40px with a 13px 600 title on the left and metadata on the right,
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

Keyboard shortcuts are shown as 20px mono caps keys on `--surface-2` with a 4px radius, in tooltips and menus.

## Motion

- Hover and focus: 120 ms, colour only.
- Menus, popovers, the command bar: 160 ms fade and 4px rise.
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
- A pull request that adds an uppercase label outside the four allowed places explains why in its description.
- The design-lock generator and generated project guides stay separate from this guide; they describe a client's
  product, not Sydeso's.
