# UI Redesign: Clean White/Blue Theme

**Date:** 2026-07-02
**Status:** Approved

## Goal

Replace the current "Academic Ink" design (warm paper, grain texture, grid background, vermilion accent, three fonts, decorative effects) with a clean, neutral product UI. The current look reads as "AI-generated"; the new look should be plain, intuitive, and unbranded. No behavior, routing, or data changes.

## Approach

Retheme through the existing semantic token layer plus targeted component edits. The app already maps Tailwind colors (`paper`, `surface`, `ink`, `accent`, …) to CSS variables in `src/index.css`, so the palette swap happens there; component edits remove decoration and restructure the layout. No rewrite of pages, hooks, or logic.

## Color Tokens

### Light theme (white palette, blue accent)

| Token | Value | Usage |
|---|---|---|
| `paper` | `#ffffff` | page background |
| `surface` | `#ffffff` | cards |
| `surface-2` | `#f3f4f6` (gray-100) | hover fills, secondary surfaces |
| `line` | `#e5e7eb` (gray-200) | card borders, dividers |
| `ink` | `#111827` (gray-900) | primary text |
| `ink-soft` | `#6b7280` (gray-500) | secondary text |
| `ink-faint` | `#9ca3af` (gray-400) | tertiary text |
| `accent` | `#2563eb` (blue-600) | buttons, links, active nav, progress bars |
| `success` / `danger` / `warning` | muted green / red / amber | verdicts, badges |

Cards are distinguished from the page by the 1px `line` border, not by background contrast or shadow. At most one barely-visible shadow on cards; none is also acceptable.

### Dark theme (dark gray palette)

| Token | Value | Usage |
|---|---|---|
| `paper` | `#0a0a0a` (neutral-950) | page background |
| `surface` | `#111827` (gray-900) | cards |
| `surface-2` | `#1f2937` (gray-800) | hover fills |
| `line` | `#1f2937` (gray-800) | borders |
| `ink` | `#f3f4f6` (gray-100) | primary text |
| `ink-soft` | `#9ca3af` (gray-400) | secondary text |
| `ink-faint` | `#6b7280` (gray-500) | tertiary text |
| `accent` | `#3b82f6` (blue-500) | brighter blue for dark backgrounds |

## Removed Entirely

- Paper/grain noise overlay (`body::before` SVG turbulence)
- Millimeter grid background (`background-image` linear gradients on `body`)
- Hover glow blobs (StatCard corner blur)
- Accent tick marks on nav items
- Chips and eyebrow mono labels (`chip-accent`, `eyebrow` styles)
- Entrance animations (`fade-rise`, `fade-in`, `scale-in`, `pulse-ring` on non-timer elements); keep fast hover/color transitions only. The timer pulse for low remaining time may stay if trivially retained.

## Typography

- **Inter only** (replaces Unbounded + Golos Text + JetBrains Mono). Load via the same mechanism currently used for fonts (check `index.html`).
- Tabular figures (`font-variant-numeric: tabular-nums`) for stats, scores, and the timer.
- Hierarchy through size and weight only; `font-display` and `font-mono` classes are removed or remapped to Inter.

## Structure

### Navigation

- Delete the fixed left sidebar (desktop and mobile slide-out drawer).
- New slim **top navbar**: logo/app name left, three links (Дашборд, Тесты, История), theme toggle right. Active link is blue.
- Mobile: links stay in the same row (3 short labels fit); no drawer, no hamburger.
- Content below navbar: centered `max-w-5xl` column.
- The sidebar's "Формат КТ" info block (50 вопросов / 100 мин / порог) moves to the Tests page as one plain line of text near the exam presets. It is not on the Dashboard.

### Dashboard

- Hero banner (marketing text, chip, background) → single row: page title "Дашборд" left, "Начать экзамен" primary button right.
- 4 flat stat cards: label + number only. No icons, no hints, no tones/glows.
- Chart + per-discipline bars: keep content, apply new card style, blue bars/lines.
- Recent attempts list: keep, restyle.

### All pages (Tests, Test, Results, History)

- Same card style everywhere: `surface` background, 1px `line` border, `rounded-lg` (~0.5rem, replacing the 1.25rem `rounded-card`), consistent padding.
- Blue replaces vermilion in every accent usage (buttons, selected options, links, score elements where accent-colored).
- Layout otherwise unchanged; only decoration is stripped.

## Components affected

`src/index.css` (tokens, shared classes), `tailwind.config.js` (fonts, radius, shadows, animations), `index.html` (font loading), `Layout.tsx`, `Sidebar.tsx` (deleted or replaced by `Navbar.tsx`), `Topbar.tsx` (merged into navbar), `StatCard.tsx`, `ScoreChart.tsx`, `ScoreBadge.tsx`, `ProgressBar.tsx`, `OptionCard.tsx`, `Timer.tsx`, `ConfirmDialog.tsx`, `SubjectPicker.tsx`, `ThemeToggle.tsx`, all 5 pages.

## Out of scope

- Any change to routing, state, storage, grading, test generation, or data.
- New features or content changes beyond relocating the "Формат КТ" info line.

## Verification

- `npm run build` passes (TypeScript + Vite).
- Visual check of every page in both themes: no paper/orange remnants, navbar works on narrow viewport, theme toggle still functions.
