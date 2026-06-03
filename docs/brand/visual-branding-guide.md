# Sydeso Visual Branding Guide

Version: 1.0.0
Status: Active
Owner: Product Design
Last Updated: 2026-06-02

---

## Purpose

This guide defines the visual lock for Sydeso.

All marketing surfaces, product UI, and generated project UI guidance should follow this system.

The desired feel is calm, precise, editorial, and highly structured.

Think Notion clarity with Linear precision.

---

## Brand Principles

- Neutral before decorative
- Clear hierarchy before ornament
- Compact density without clutter
- Soft surfaces, crisp borders, minimal shadowing
- Quiet motion over flashy motion
- High trust, high legibility, low noise

---

## Visual Direction

### Do

- Use off-white and graphite neutrals
- Use a single accent color for emphasis
- Keep radii consistent across the product
- Use generous whitespace around key content
- Prefer succinct labels and direct language

### Do Not

- Use neon gradients or cyberpunk styling
- Use heavy glows or aggressive shadows
- Overuse caps lock, badges, or decorative dividers
- Mix too many accent colors in one view
- Create dense UI without hierarchy

---

## Color System

| Token | Intent | Usage |
| --- | --- | --- |
| Paper | Base background | App shells and page chrome |
| Surface | Elevated surface | Cards, panels, menus |
| Text | Primary copy | Titles and body text |
| Muted | Secondary copy | Helper text and metadata |
| Line | Border color | Dividers, inputs, cards |
| Accent | Primary action | Links, active states, highlights |
| Accent Soft | Subtle emphasis | Pills, chips, selected surfaces |
| Success | Positive state | Approved, ready, healthy |
| Danger | Negative state | Error, rejected, blocked |

Accent should remain restrained. It should guide attention, not dominate the interface.

---

## Typography

- Primary typeface: Inter or equivalent neutral sans
- Use large, confident display text for hero and page titles
- Use compact line height for headings
- Keep body copy readable and direct
- Avoid decorative or expressive display faces

Rules:

- Headings should feel editorial, not playful
- Body copy should stay around 1.5 to 1.75 line height
- Labels should be short and functional

---

## Layout

- Use a centered content column with broad margins
- Prefer 12-column thinking, even when the implementation is CSS grid
- Keep cards aligned to a consistent spacing rhythm
- Use one primary hierarchy per page section
- Favor structured sections over dense feature dumps

Recommended spacing scale:

- 4 px for micro adjustments
- 8 px for small gaps
- 16 px for component padding
- 24 px for section relationships
- 40 px or more for major section breaks

---

## Components

### Navigation

- Use rounded, low-friction navigation chrome
- Keep links minimal and direct
- Highlight the current location subtly

### Buttons

- Primary actions should be filled and obvious
- Secondary actions should use outline or soft surfaces
- Avoid loud shadows and oversized button bodies

### Cards

- Cards should feel like organized notes, not panels of machinery
- Use 1 px borders and mild elevation
- Keep card interiors calm and readable

### Forms

- Inputs should be legible and lightly bordered
- Focus states must be obvious and accessible
- Helper copy should be short and reassuring

### Workflow Views

- Use clear state chips and linear progression
- Avoid cluttered timeline metaphors
- Show what changed, what is next, and what is locked

---

## Motion

- Motion should be subtle and short
- Use transitions for hover, focus, and state changes
- Avoid large-scale parallax, bounce, or ornamental animation

Recommended durations:

- 120 ms for micro interaction
- 160 ms for hover and focus
- 200 ms for structural transitions

---

## Accessibility

- Maintain readable contrast on all surfaces
- Preserve visible focus states
- Never use color alone to communicate status
- Ensure touch targets remain comfortable
- Keep content language concise and scannable

---

## Generated Design Lock Output

When Sydeso generates a design guide for a project, the artifact should include:

- Brand summary and visual intent
- Color tokens and usage rules
- Type scale and hierarchy rules
- Spacing and layout rules
- Component rules and examples
- Motion and interaction rules
- Accessibility baseline
- Page templates and screen patterns
- Enforcement rules for QA and development

The generated artifact should be versioned, immutable, and usable as the source of truth for project UI work.

---

## Enforcement

- Design approval should require a locked guide
- Developers should reference the guide before implementation
- QA should compare implemented screens against the guide
- New visual changes should create a new guide version
