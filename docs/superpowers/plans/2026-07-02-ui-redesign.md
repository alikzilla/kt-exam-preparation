# UI Redesign (White/Blue Theme) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Academic Ink" theme (paper texture, vermilion accent, 3 fonts, sidebar) with a clean white/blue light theme, dark-gray dark theme, Inter-only typography, a top navbar, and decoration-free flat cards. Zero behavior change.

**Architecture:** The app maps Tailwind semantic colors (`paper`, `surface`, `ink`, `accent`, …) to CSS variables in `src/index.css`. Task 1 swaps the token values and shared component classes; later tasks strip decoration from components/pages and replace the sidebar with a navbar. Spec: `docs/superpowers/specs/2026-07-02-ui-redesign-design.md`.

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind CSS 3, react-router-dom 6. No test framework exists — this is a pure visual retheme, so each task's verification cycle is `npm run build` (runs `tsc -b && vite build`) plus a final visual check in Task 8. Do not add a test framework.

## Global Constraints

- No changes to routing, hooks, `src/lib/`, `src/data/`, `src/types/`, or localStorage keys.
- All UI copy stays Russian, verbatim as shown in this plan.
- Light theme: white backgrounds, `#2563eb` (blue-600) accent. Dark theme: `#0a0a0a` page, gray-900/800 surfaces, `#3b82f6` (blue-500) accent.
- Typography: Inter only. Numeric stats use `tabular-nums`, never `font-mono`.
- Cards: `bg-surface`, 1px `border-line`, `rounded-lg`, no shadows (exception: modal dialog gets `shadow-modal`).
- Removed styles: grain/noise overlay, grid background, hover glows, chips, eyebrow mono-caps labels, entrance animations. Only `pulse-ring` (timer) survives.
- Working directory: repo root. Run all commands from there.
- Each task ends with a passing `npm run build` and a commit. Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Design tokens, shared CSS, fonts

**Files:**
- Modify: `index.html`
- Modify: `src/index.css` (full rewrite)
- Modify: `tailwind.config.js` (full rewrite)

**Interfaces:**
- Produces: CSS classes `.surface`, `.surface-2`, `.surface-interactive`, `.eyebrow` (transitional, deleted in Task 8), `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-sm`, `.field`; Tailwind tokens `paper/surface/surface-2/line/ink/ink-soft/ink-faint/accent/success/danger/warning`, `rounded-card` (transitional), `shadow-modal`, `animate-pulse-ring`. All later tasks use these.
- Note: `.btn-accent`, `.chip`, `.chip-accent`, `.stagger`, and entrance animations are **removed** here; pages still referencing them render unstyled-but-functional until their own task. This is expected mid-plan.

- [ ] **Step 1: Check `accent-soft` has no usages before dropping the token**

Run: `grep -rn "accent-soft" src/ index.html`
Expected: no output. (If there are hits, replace each with `accent` in that file first.)

- [ ] **Step 2: Update `index.html`**

Replace the two `theme-color` metas and the font `<link>` block. The `<head>` becomes:

```html
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
    <link rel="icon" type="image/png" sizes="48x48" href="/favicon.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <title>КТ Подготовка — Магистратура М094</title>

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <script>
      // Применяем тему до первой отрисовки, чтобы избежать мигания.
      (function () {
        try {
          var stored = localStorage.getItem("kt-exam:theme") || "system";
          var dark =
            stored === "dark" ||
            (stored === "system" &&
              window.matchMedia("(prefers-color-scheme: dark)").matches);
          document.documentElement.classList.toggle("dark", dark);
        } catch (e) {}
      })();
    </script>
  </head>
```

Keep the `<body>` unchanged.

- [ ] **Step 3: Rewrite `src/index.css`**

Full new content:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ============================================================
   Дизайн-токены: светлая тема — белая с синим акцентом,
   тёмная — тёмно-серая. Цвета как тройки RGB для alpha в Tailwind.
   ============================================================ */
:root {
  --c-paper: 255 255 255; /* white */
  --c-surface: 255 255 255;
  --c-surface-2: 243 244 246; /* gray-100 */
  --c-line: 229 231 235; /* gray-200 */
  --c-ink: 17 24 39; /* gray-900 */
  --c-ink-soft: 107 114 128; /* gray-500 */
  --c-ink-faint: 156 163 175; /* gray-400 */
  --c-accent: 37 99 235; /* blue-600 */
  --c-success: 22 163 74; /* green-600 */
  --c-danger: 220 38 38; /* red-600 */
  --c-warning: 217 119 6; /* amber-600 */

  color-scheme: light;
}

html.dark {
  --c-paper: 10 10 10; /* neutral-950 */
  --c-surface: 17 24 39; /* gray-900 */
  --c-surface-2: 31 41 55; /* gray-800 */
  --c-line: 31 41 55; /* gray-800 */
  --c-ink: 243 244 246; /* gray-100 */
  --c-ink-soft: 156 163 175; /* gray-400 */
  --c-ink-faint: 107 114 128; /* gray-500 */
  --c-accent: 59 130 246; /* blue-500 */
  --c-success: 34 197 94; /* green-500 */
  --c-danger: 239 68 68; /* red-500 */
  --c-warning: 245 158 11; /* amber-500 */

  color-scheme: dark;
}

html,
body,
#root {
  min-height: 100%;
}

html {
  background-color: rgb(var(--c-paper));
}

body {
  margin: 0;
  font-family: theme("fontFamily.sans");
  color: rgb(var(--c-ink));
  background-color: rgb(var(--c-paper));
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

::selection {
  background-color: rgb(var(--c-accent) / 0.2);
  color: rgb(var(--c-ink));
}

:focus-visible {
  outline: 2px solid rgb(var(--c-accent));
  outline-offset: 2px;
  border-radius: 6px;
}

* {
  scrollbar-width: thin;
  scrollbar-color: rgb(var(--c-line)) transparent;
}
*::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
*::-webkit-scrollbar-thumb {
  background-color: rgb(var(--c-line));
  border-radius: 999px;
  border: 3px solid transparent;
  background-clip: content-box;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}

/* ============================================================
   Переиспользуемые компонентные утилиты
   ============================================================ */
@layer components {
  .surface {
    @apply rounded-lg border border-line bg-surface;
  }

  .surface-2 {
    @apply rounded-lg border border-line bg-surface-2;
  }

  .surface-interactive {
    @apply surface transition-colors hover:bg-surface-2/60;
  }

  /* Переходный класс: удаляется в финальной уборке,
     когда все страницы перестанут его использовать. */
  .eyebrow {
    @apply text-xs font-medium text-ink-faint;
  }

  .btn {
    @apply inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
      transition-colors disabled:cursor-not-allowed disabled:opacity-50;
  }

  .btn-primary {
    @apply btn bg-accent text-white hover:bg-accent/90;
  }

  .btn-secondary {
    @apply btn border border-line bg-surface text-ink hover:bg-surface-2;
  }

  .btn-ghost {
    @apply btn text-ink-soft hover:bg-surface-2 hover:text-ink;
  }

  .btn-sm {
    @apply px-3 py-1.5 text-xs;
  }

  .field {
    @apply rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink
      transition placeholder:text-ink-faint
      focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25;
  }
}
```

- [ ] **Step 4: Rewrite `tailwind.config.js`**

Full new content:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        // Переходные алиасы: страницы ещё содержат font-display/font-mono,
        // оба удаляются в финальной уборке.
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        paper: "rgb(var(--c-paper) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--c-surface-2) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        "ink-soft": "rgb(var(--c-ink-soft) / <alpha-value>)",
        "ink-faint": "rgb(var(--c-ink-faint) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        success: "rgb(var(--c-success) / <alpha-value>)",
        danger: "rgb(var(--c-danger) / <alpha-value>)",
        warning: "rgb(var(--c-warning) / <alpha-value>)",
      },
      borderRadius: {
        // Переходный токен (rounded-card ещё в SubjectPicker), удаляется в уборке.
        card: "0.5rem",
      },
      boxShadow: {
        modal: "0 10px 40px -10px rgb(0 0 0 / 0.25)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgb(var(--c-danger) / 0.45)" },
          "70%": { boxShadow: "0 0 0 8px rgb(var(--c-danger) / 0)" },
          "100%": { boxShadow: "0 0 0 0 rgb(var(--c-danger) / 0)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: exits 0. (Type errors would only come from removed exports — there are none in this task.)

- [ ] **Step 6: Commit**

```bash
git add index.html src/index.css tailwind.config.js
git commit -m "feat: swap design tokens to white/blue theme, Inter font"
```

---

### Task 2: Top navbar replaces sidebar

**Files:**
- Create: `src/components/Navbar.tsx`
- Modify: `src/components/Layout.tsx` (full rewrite)
- Delete: `src/components/Sidebar.tsx`, `src/components/Topbar.tsx`

**Interfaces:**
- Consumes: `.surface-2` hover classes and tokens from Task 1; existing `ThemeToggle` from `src/theme/ThemeToggle.tsx` (unchanged signature, restyled in Task 3).
- Produces: `Navbar` (no props), rendered by `Layout`. Navbar height is `h-14` + 1px border = 57px; TestPage's sticky offset `top-[57px]` (Task 6) relies on this.

- [ ] **Step 1: Create `src/components/Navbar.tsx`**

```tsx
import { NavLink } from "react-router-dom";
import ThemeToggle from "../theme/ThemeToggle";

const NAV = [
  { to: "/", label: "Дашборд", end: true },
  { to: "/tests", label: "Тесты", end: false },
  { to: "/history", label: "История", end: false },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:gap-6 sm:px-6">
        <NavLink
          to="/"
          className="flex shrink-0 items-center gap-2 text-sm font-semibold text-ink"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
            КТ
          </span>
          <span className="hidden sm:inline">Подготовка</span>
        </NavLink>
        <nav className="flex items-center gap-1">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-accent"
                    : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Rewrite `src/components/Layout.tsx`**

```tsx
import type { ReactNode } from "react";
import Navbar from "./Navbar";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-ink">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Delete the old navigation components**

```bash
rm src/components/Sidebar.tsx src/components/Topbar.tsx
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: exits 0. If it fails with unused-import errors in `src/components/icons.tsx` consumers, nothing else imports Sidebar/Topbar — only Layout did.

- [ ] **Step 5: Commit**

```bash
git add -A src/components/Navbar.tsx src/components/Layout.tsx src/components/Sidebar.tsx src/components/Topbar.tsx
git commit -m "feat: replace sidebar and topbar with slim top navbar"
```

---

### Task 3: Shared components restyle

**Files:**
- Modify: `src/theme/ThemeToggle.tsx`, `src/components/ScoreBadge.tsx`, `src/components/Timer.tsx`, `src/components/ProgressBar.tsx`, `src/components/OptionCard.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/SubjectPicker.tsx`

**Interfaces:**
- Consumes: classes/tokens from Task 1.
- Produces: identical props/exports as before — **no signature changes** (`OPTION_LETTERS` still exported from OptionCard). StatCard is intentionally NOT here; its props change together with its only consumer in Task 4.

- [ ] **Step 1: Rewrite `src/theme/ThemeToggle.tsx`**

```tsx
import { useTheme, type Theme } from "./ThemeProvider";
import { SunIcon, MoonIcon, MonitorIcon } from "../components/icons";

const OPTIONS: {
  value: Theme;
  label: string;
  Icon: typeof SunIcon;
}[] = [
  { value: "light", label: "Светлая", Icon: SunIcon },
  { value: "system", label: "Системная", Icon: MonitorIcon },
  { value: "dark", label: "Тёмная", Icon: MoonIcon },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Тема оформления"
      className="inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface-2 p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            title={label}
            aria-label={label}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              active
                ? "bg-surface text-accent"
                : "text-ink-faint hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `src/components/ScoreBadge.tsx`**

```tsx
export default function ScoreBadge({ percent }: { percent: number }) {
  const tone =
    percent >= 70
      ? "bg-success/10 text-success ring-success/20"
      : percent >= 50
        ? "bg-warning/10 text-warning ring-warning/20"
        : "bg-danger/10 text-danger ring-danger/20";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold tabular-nums ring-1 ring-inset ${tone}`}
    >
      {percent}%
    </span>
  );
}
```

- [ ] **Step 3: Rewrite `src/components/Timer.tsx`**

```tsx
import { formatTime } from "../hooks/useCountdown";
import { TimerIcon } from "./icons";

export default function Timer({ remaining }: { remaining: number }) {
  const low = remaining <= 5 * 60; // последние 5 минут
  return (
    <div
      role="timer"
      aria-live={low ? "assertive" : "off"}
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold tabular-nums ring-1 ring-inset transition ${
        low
          ? "animate-pulse-ring bg-danger/10 text-danger ring-danger/25"
          : "bg-surface-2 text-ink ring-line"
      }`}
    >
      <TimerIcon className="h-4 w-4" />
      <span>{formatTime(remaining)}</span>
    </div>
  );
}
```

- [ ] **Step 4: Edit `src/components/ProgressBar.tsx`**

Only the inner bar's transition changes (shorter, colors-only feel). Replace:

```tsx
        className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
```

with:

```tsx
        className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
```

- [ ] **Step 5: Rewrite `src/components/OptionCard.tsx`**

Same props and `OPTION_LETTERS` export; `rounded-xl` → `rounded-lg`, letter badge loses `font-mono`:

```tsx
import type { QuestionOption } from "../types";

type Variant = "default" | "correct" | "incorrect" | "missed";

/** Русские буквы вариантов ответа: А, Б, В, Г, Д, Е, ... */
export const OPTION_LETTERS = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

// Цвет рамки/фона карточки в режиме разбора.
const shellVariant: Record<Variant, string> = {
  default: "border-line",
  correct: "border-success/50 bg-success/5",
  incorrect: "border-danger/50 bg-danger/5",
  missed: "border-success/40 bg-success/5 border-dashed",
};

// Цвет бейджа с буквой в режиме разбора.
const badgeVariant: Record<Variant, string> = {
  default: "",
  correct: "bg-success text-white border-transparent",
  incorrect: "bg-danger text-white border-transparent",
  missed: "border-success/60 text-success",
};

export default function OptionCard({
  option,
  letter,
  selected,
  multiCorrect,
  disabled = false,
  variant = "default",
  onToggle,
}: {
  option: QuestionOption;
  letter?: string;
  selected: boolean;
  multiCorrect: boolean;
  disabled?: boolean;
  variant?: Variant;
  onToggle?: (optionId: string) => void;
}) {
  const isReview = variant !== "default";

  const interactive =
    disabled || isReview
      ? "cursor-default"
      : "cursor-pointer hover:border-accent/60 hover:bg-accent/5";

  const selectedShell =
    selected && !isReview ? "border-accent bg-accent/5" : "";

  const shell = isReview ? shellVariant[variant] : "border-line";

  const badge = isReview
    ? badgeVariant[variant] || "border-line bg-surface text-ink-faint"
    : selected
      ? "bg-accent text-white border-transparent"
      : "border-line bg-surface text-ink-faint";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle?.(option.id)}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm text-ink transition-colors duration-150 ${shell} ${interactive} ${selectedShell}`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center border text-xs font-semibold transition-colors ${
          multiCorrect ? "rounded-md" : "rounded-full"
        } ${badge}`}
      >
        {letter ?? (selected ? "✓" : "")}
      </span>
      <span className="flex-1 leading-snug">{option.text}</span>
    </button>
  );
}
```

- [ ] **Step 6: Edit `src/components/ConfirmDialog.tsx`**

Three changes. Replace:

```tsx
  const confirmClass = tone === "danger" ? "btn-accent !bg-danger" : "btn-primary";
```

with:

```tsx
  const confirmClass = tone === "danger" ? "btn-primary !bg-danger" : "btn-primary";
```

Replace:

```tsx
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />
      <div className="surface relative w-full max-w-md animate-scale-in p-6">
```

with:

```tsx
      <div className="absolute inset-0 bg-ink/40" onClick={onCancel} />
      <div className="surface relative w-full max-w-md p-6 shadow-modal">
```

Replace:

```tsx
            <h2
              id="confirm-title"
              className="font-display text-lg font-bold tracking-tight text-ink"
            >
```

with:

```tsx
            <h2
              id="confirm-title"
              className="text-lg font-semibold tracking-tight text-ink"
            >
```

Also change the dialog icon container from `rounded-xl` and `/12` opacities to:

```tsx
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
              tone === "danger"
                ? "bg-danger/10 text-danger"
                : "bg-accent/10 text-accent"
            }`}
```

- [ ] **Step 7: Edit `src/components/SubjectPicker.tsx`**

Three changes. Replace the card shell:

```tsx
            className={`rounded-card border p-4 transition duration-200 ${
              isOn
                ? "border-accent/40 bg-accent/5 shadow-card"
                : "border-line bg-surface"
            }`}
```

with:

```tsx
            className={`rounded-lg border p-4 transition-colors duration-200 ${
              isOn ? "border-accent/40 bg-accent/5" : "border-line bg-surface"
            }`}
```

Replace the pool-size chip:

```tsx
                <span className="chip">{pool} в банке</span>
```

with:

```tsx
                <span className="text-xs tabular-nums text-ink-faint">
                  {pool} в банке
                </span>
```

Replace the number input classes:

```tsx
                    className="field w-16 text-center font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
```

with:

```tsx
                    className="field w-16 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
```

- [ ] **Step 8: Build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 9: Commit**

```bash
git add src/theme/ThemeToggle.tsx src/components/ScoreBadge.tsx src/components/Timer.tsx src/components/ProgressBar.tsx src/components/OptionCard.tsx src/components/ConfirmDialog.tsx src/components/SubjectPicker.tsx
git commit -m "feat: restyle shared components (flat cards, blue accent)"
```

---

### Task 4: Dashboard page + StatCard

**Files:**
- Modify: `src/components/StatCard.tsx` (full rewrite, props change)
- Modify: `src/pages/DashboardPage.tsx` (full rewrite)

**Interfaces:**
- Consumes: `.surface`, `.btn-primary` from Task 1; `ScoreChart`, `ScoreBadge` unchanged. `ScoreChart.tsx` needs **no edits** in any task — it only uses semantic tokens (`text-accent`, `stroke-line`, `fill-surface`), so it turns blue automatically via Task 1.
- Produces: `StatCard` props become `{ label: string; value: string }` — `icon`, `hint`, `tone` are deleted. DashboardPage is its only consumer.

- [ ] **Step 1: Rewrite `src/components/StatCard.tsx`**

```tsx
export default function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="surface p-5">
      <div className="text-sm text-ink-soft">{label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-ink">
        {value}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `src/pages/DashboardPage.tsx`**

Hero banner → title row with primary button; icons removed from imports; stagger/animations removed:

```tsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { loadAttempts } from "../lib/storage";
import { computeStats } from "../lib/stats";
import { scorePercent } from "../lib/grading";
import { getQuestionsBySubject, getSubjectName } from "../data";
import { EXAM_PRESETS } from "../data/exam";
import { useStartTest } from "../hooks/useStartTest";
import StatCard from "../components/StatCard";
import ScoreChart from "../components/ScoreChart";
import ScoreBadge from "../components/ScoreBadge";

export default function DashboardPage() {
  const { startPreset } = useStartTest();
  const attempts = useMemo(() => loadAttempts(), []);
  const stats = useMemo(() => computeStats(attempts), [attempts]);
  const recent = attempts.slice(0, 5);

  const fullExam = EXAM_PRESETS[0];
  const fullExamTotal = useMemo(
    () =>
      fullExam.disciplines.reduce(
        (s, d) =>
          s + Math.min(d.count, getQuestionsBySubject(d.subjectId).length),
        0
      ),
    [fullExam]
  );

  return (
    <div className="space-y-6">
      {/* Заголовок + главное действие */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Дашборд
        </h1>
        <button
          type="button"
          onClick={() => startPreset(fullExam)}
          disabled={fullExamTotal === 0}
          className="btn-primary"
        >
          Начать экзамен
        </button>
      </div>

      {/* Метрики */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Всего попыток" value={`${stats.totalAttempts}`} />
        <StatCard label="Средний результат" value={`${stats.averagePercent}%`} />
        <StatCard label="Лучший результат" value={`${stats.bestPercent}%`} />
        <StatCard label="Сдано экзаменов" value={`${stats.examsPassed}`} />
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* График динамики */}
        <section className="surface p-5 lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-ink">
            Динамика результатов
          </h2>
          <ScoreChart data={stats.timeline} />
        </section>

        {/* Результаты по дисциплинам */}
        <section className="surface p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-ink">
            По дисциплинам
          </h2>
          {stats.perDiscipline.length === 0 ? (
            <p className="text-sm text-ink-faint">Пока нет данных.</p>
          ) : (
            <div className="space-y-4">
              {stats.perDiscipline.map((d) => (
                <div key={d.subjectId}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-ink-soft">
                      {getSubjectName(d.subjectId)}
                    </span>
                    <span className="font-semibold tabular-nums text-ink">
                      {d.percent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-300"
                      style={{ width: `${d.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Последние попытки */}
      <section className="surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Последние попытки</h2>
          <Link
            to="/history"
            className="text-sm font-medium text-accent hover:underline"
          >
            Вся история
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-ink-soft">
              Здесь появятся ваши результаты после первого теста.
            </p>
            <Link to="/tests" className="btn-primary">
              Перейти к тестам
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((a) => (
              <li key={a.id}>
                <Link
                  to={`/results/${a.id}`}
                  className="-mx-2 flex items-center justify-between rounded-lg px-2 py-3 transition-colors hover:bg-surface-2"
                >
                  <div>
                    <div className="text-sm font-medium text-ink">
                      {a.mode === "exam"
                        ? (a.examTitle ?? "Экзамен")
                        : "Тренировка"}{" "}
                      <span className="tabular-nums text-ink-soft">
                        · {a.result.correct}/{a.result.total}
                      </span>
                    </div>
                    <div className="text-xs tabular-nums text-ink-faint">
                      {new Date(a.takenAt).toLocaleString("ru-RU")}
                    </div>
                  </div>
                  <ScoreBadge percent={scorePercent(a.result)} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: exits 0. A failure here most likely means a StatCard prop mismatch — both files must change together.

- [ ] **Step 4: Commit**

```bash
git add src/components/StatCard.tsx src/pages/DashboardPage.tsx
git commit -m "feat: simplify dashboard (title row, flat stat cards)"
```

---

### Task 5: Tests page

**Files:**
- Modify: `src/pages/TestsPage.tsx` (full rewrite)

**Interfaces:**
- Consumes: `.surface`, `.btn-primary` from Task 1; `SubjectPicker` (Task 3, unchanged props); data helpers unchanged.
- Produces: nothing consumed by later tasks. Adds the relocated "Формат КТ" info line (was in the deleted sidebar).

- [ ] **Step 1: Rewrite `src/pages/TestsPage.tsx`**

Everything above the `return` (imports minus icons, state, handlers) stays byte-identical to the current file except the icons import line, which becomes:

```tsx
import { ArrowRightIcon } from "../components/icons";
```

The `return` becomes:

```tsx
  return (
    <div className="space-y-10">
      {/* Официальные форматы */}
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Экзамены по формату КТ
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Выберите формат — вопросы и варианты перемешиваются при каждой
            попытке, по завершении выставляется вердикт по пороговому баллу.
          </p>
          <p className="mt-1 text-sm text-ink-faint">
            Формат КТ: 50 вопросов · 100 минут · порог ≥ 7 по каждой дисциплине.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {EXAM_PRESETS.map((preset) => (
            <div key={preset.id} className="surface flex flex-col p-5">
              <div className="flex items-center justify-between text-xs text-ink-faint">
                <span className="font-medium text-accent">{preset.short}</span>
                <span className="tabular-nums">
                  {presetTotal(preset)} вопросов
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-ink">
                {preset.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {preset.description}
              </p>
              <ul className="mt-4 space-y-1.5 border-t border-line pt-3 text-xs text-ink-soft">
                {preset.disciplines.map((d) => (
                  <li key={d.subjectId} className="flex justify-between">
                    <span>{getSubjectName(d.subjectId)}</span>
                    <span className="tabular-nums text-ink-faint">
                      {d.count}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-xs tabular-nums text-ink-faint">
                {preset.durationMinutes} мин · порог {preset.passThreshold}
              </div>
              <button
                type="button"
                onClick={() => startPreset(preset)}
                className="btn-primary mt-4 w-full"
              >
                Начать экзамен
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Тренировка */}
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Тренировка
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Выберите дисциплины и количество вопросов. Таймер по желанию.
          </p>
        </div>

        <SubjectPicker
          subjects={subjects}
          selected={selected}
          counts={counts}
          poolSizes={poolSizes}
          onToggle={toggle}
          onCountChange={setCount}
        />

        <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-surface-2">
          <input
            type="checkbox"
            checked={timed}
            onChange={(e) => setTimed(e.target.checked)}
            className="h-4 w-4 accent-[rgb(var(--c-accent))]"
          />
          Включить таймер (2 минуты на вопрос)
        </label>

        <div className="surface flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <div className="text-2xl font-semibold leading-none tabular-nums text-ink">
              {practiceTotal}
            </div>
            <div className="mt-1 text-xs text-ink-soft">вопросов в наборе</div>
          </div>
          <button
            type="button"
            onClick={onStartPractice}
            disabled={practiceTotal === 0}
            className="btn-primary"
          >
            Начать тренировку
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
```

(The `TimerIcon` and `BookIcon` imports are gone; make sure no other reference to them remains in the file.)

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: exits 0. Unused-import TS errors here mean the icons import line wasn't trimmed.

- [ ] **Step 3: Commit**

```bash
git add src/pages/TestsPage.tsx
git commit -m "feat: simplify tests page, add exam format info line"
```

---

### Task 6: Test-taking page

**Files:**
- Modify: `src/pages/TestPage.tsx`

**Interfaces:**
- Consumes: Navbar height 57px (Task 2) for the sticky header offset; `OptionCard`, `Timer`, `ProgressBar`, `ConfirmDialog` (Task 3, unchanged props).
- Produces: nothing consumed later. Logic (`TestRunner`, grading, countdown) untouched.

- [ ] **Step 1: Edit the sticky session header**

Replace:

```tsx
      <div className="sticky top-[57px] z-10 -mx-4 space-y-3 border-b border-line bg-paper/85 px-4 py-3 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-mono text-xs uppercase tracking-wider text-ink-faint">
            {mode === "exam" ? (examTitle ?? "Экзамен") : "Тренировка"}
            <span className="text-ink"> · {session.index + 1}</span>
            <span className="text-ink-faint">/{session.total}</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-xs text-ink-soft sm:inline">
              отвечено {session.answeredCount}/{session.total}
            </span>
```

with:

```tsx
      <div className="sticky top-[57px] z-10 -mx-4 space-y-3 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-xs text-ink-faint">
            {mode === "exam" ? (examTitle ?? "Экзамен") : "Тренировка"}
            <span className="tabular-nums text-ink"> · {session.index + 1}</span>
            <span className="tabular-nums text-ink-faint">/{session.total}</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs tabular-nums text-ink-soft sm:inline">
              отвечено {session.answeredCount}/{session.total}
            </span>
```

- [ ] **Step 2: Edit the question-navigator buttons**

Replace:

```tsx
                className={`h-8 w-8 rounded-lg font-mono text-xs font-medium transition ${
                  isCurrent
                    ? "bg-accent text-white shadow-accent"
                    : answered
                      ? "bg-accent/15 text-accent hover:bg-accent/25"
                      : "bg-surface-2 text-ink-soft hover:bg-line"
                }`}
```

with:

```tsx
                className={`h-8 w-8 rounded-lg text-xs font-medium tabular-nums transition-colors ${
                  isCurrent
                    ? "bg-accent text-white"
                    : answered
                      ? "bg-accent/10 text-accent hover:bg-accent/20"
                      : "bg-surface-2 text-ink-soft hover:bg-line"
                }`}
```

- [ ] **Step 3: Edit the question card**

Replace:

```tsx
      <div key={current.id} className="surface animate-fade-rise p-6 sm:p-7">
        <div className="eyebrow text-accent">
          {getSubjectName(current.subjectId)}
        </div>
```

with:

```tsx
      <div key={current.id} className="surface p-6 sm:p-7">
        <div className="text-xs font-medium text-accent">
          {getSubjectName(current.subjectId)}
        </div>
```

Also replace the multi-correct hint and image classes:

```tsx
          <p className="mt-1.5 inline-flex rounded-md bg-warning/12 px-2 py-0.5 text-xs font-medium text-warning">
```

with:

```tsx
          <p className="mt-1.5 inline-flex rounded-md bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
```

and:

```tsx
            className="mt-4 max-h-64 rounded-xl border border-line"
```

with:

```tsx
            className="mt-4 max-h-64 rounded-lg border border-line"
```

- [ ] **Step 4: Edit the footer buttons**

Replace the finish button's class `btn-accent` with `btn-primary` (the "Завершить" button). The "Далее" button already uses `btn-primary`; "Назад" stays `btn-secondary`.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/pages/TestPage.tsx
git commit -m "feat: restyle test session page"
```

---

### Task 7: Results and History pages

**Files:**
- Modify: `src/pages/ResultsPage.tsx`
- Modify: `src/pages/HistoryPage.tsx`

**Interfaces:**
- Consumes: `.surface`, `.surface-2`, `.btn-*` from Task 1; `ScoreBadge`, `OptionCard`, `ConfirmDialog` (Task 3, unchanged props).
- Produces: nothing consumed later.

- [ ] **Step 1: Edit `src/pages/ResultsPage.tsx` — summary card**

Remove the glow blob entirely — delete this block:

```tsx
        <div
          className={`pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full blur-3xl ${
            isExam
              ? passedExam
                ? "bg-success/15"
                : "bg-danger/15"
              : "bg-accent/12"
          }`}
        />
```

and change the card wrapper from:

```tsx
      <div className="surface relative overflow-hidden p-6 sm:p-7">
```

to:

```tsx
      <div className="surface p-6 sm:p-7">
```

Replace the heading block:

```tsx
          <div>
            <div className="eyebrow">{isExam ? "Экзамен" : "Тренировка"}</div>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
              {isExam ? (attempt.examTitle ?? "Экзамен") : "Свободный режим"}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Правильных{" "}
              <span className="font-mono font-semibold text-ink">
                {result.correct}
              </span>{" "}
              из{" "}
              <span className="font-mono text-ink-soft">{result.total}</span>
            </p>
          </div>
```

with:

```tsx
          <div>
            <div className="text-xs font-medium text-ink-faint">
              {isExam ? "Экзамен" : "Тренировка"}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              {isExam ? (attempt.examTitle ?? "Экзамен") : "Свободный режим"}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Правильных{" "}
              <span className="font-semibold tabular-nums text-ink">
                {result.correct}
              </span>{" "}
              из{" "}
              <span className="tabular-nums text-ink-soft">{result.total}</span>
            </p>
          </div>
```

In the pass/fail banner and per-subject cards, replace every `/12` opacity with `/10` (`bg-success/12` → `bg-success/10`, `bg-danger/12` → `bg-danger/10`), `rounded-xl` → `rounded-lg`, and `font-mono text-xl` → `text-xl tabular-nums`. Remove the now-unneeded `relative` prefix on the three inner blocks (`relative mt-5 flex`, `relative mt-5 grid`, `relative mt-6 flex` → drop `relative `).

Replace the action buttons:

```tsx
          <Link to="/tests" className="btn-accent">
```

with:

```tsx
          <Link to="/tests" className="btn-primary">
```

- [ ] **Step 2: Edit `src/pages/ResultsPage.tsx` — review section**

Replace:

```tsx
        <div className="mb-4">
          <div className="eyebrow">Разбор</div>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-ink">
            Ответы по вопросам
          </h2>
        </div>
```

with:

```tsx
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">
          Ответы по вопросам
        </h2>
```

In the per-question cards: `font-mono text-ink-faint` (question number) → `tabular-nums text-ink-faint`; the verdict badge `/12` opacities → `/10`; the subject line

```tsx
                <div className="font-mono text-xs uppercase tracking-wider text-ink-faint">
```

→

```tsx
                <div className="text-xs text-ink-faint">
```

and the explanation block `rounded-xl` → `rounded-lg`.

- [ ] **Step 3: Edit `src/pages/HistoryPage.tsx`**

Empty state — replace the heading:

```tsx
          <h1 className="font-display text-xl font-bold tracking-tight text-ink">
```

with:

```tsx
          <h1 className="text-xl font-semibold tracking-tight text-ink">
```

and the icon container `rounded-2xl` → `rounded-lg`.

List header — replace:

```tsx
        <div>
          <div className="eyebrow">Журнал</div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
            Все попытки{" "}
            <span className="font-mono text-ink-faint">({attempts.length})</span>
          </h1>
        </div>
```

with:

```tsx
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Все попытки{" "}
          <span className="tabular-nums text-ink-faint">
            ({attempts.length})
          </span>
        </h1>
```

List items — replace `font-mono text-ink-soft` → `tabular-nums text-ink-soft` and `font-mono text-xs text-ink-faint` → `text-xs tabular-nums text-ink-faint`.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ResultsPage.tsx src/pages/HistoryPage.tsx
git commit -m "feat: restyle results and history pages"
```

---

### Task 8: Cleanup sweep and visual verification

**Files:**
- Modify: `src/index.css`, `tailwind.config.js`
- Possibly modify: `src/components/icons.tsx` (only if unused icon exports cause no-unused warnings — exports are allowed to stay; do NOT prune icons.tsx otherwise)

**Interfaces:**
- Consumes: everything above. Deletes the transitional `.eyebrow` class, `font-display`/`font-mono` aliases, and `rounded-card` token once no usages remain.

- [ ] **Step 1: Verify no leftover legacy classes**

Run: `grep -rn "font-display\|font-mono\|eyebrow\|chip\|stagger\|animate-fade\|animate-scale\|rounded-card\|btn-accent\|shadow-card\|shadow-lift\|shadow-accent" src/ --include="*.tsx" --include="*.ts"`
Expected: no output. If any hit appears, fix that file using the corresponding task's styling rules (e.g. `font-mono` on numbers → `tabular-nums`), then re-run.

Note: `surface-interactive` stays — HistoryPage list items keep it for hover feedback on clickable cards, and its Task 1 definition is already decoration-free (color change only). It is intentionally not in this grep.

- [ ] **Step 2: Delete transitional CSS and config entries**

In `src/index.css`, delete the `.eyebrow` rule (and its comment).

In `tailwind.config.js`, delete the `display` and `mono` font aliases (keep `sans`) and the entire `borderRadius` block with the `card` key.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Visual verification in both themes**

Run: `npm run dev` (background) and open `http://localhost:5173`.

Check, in light AND dark theme (use the toggle in the navbar):
1. Dashboard: white/dark-gray flat cards with 1px borders, no icons in stat cards, blue "Начать экзамен" button, blue chart line and progress bars.
2. Tests: exam preset cards without chips, "Формат КТ: 50 вопросов · 100 минут · порог ≥ 7…" line present, practice section works, blue buttons.
3. Start a short practice test: sticky header sits flush under the navbar (no gap/overlap), question navigator buttons blue, options highlight blue on select, timer appears when enabled.
4. Finish the test: results summary, per-discipline cards, review list with green/red option states.
5. History: list renders, "Очистить" opens the dialog with modal shadow.
6. No paper texture, no grid background, no orange anywhere, no serif/display font.
7. Resize to ~375px width: navbar fits on one row (brand collapses to "КТ" icon), pages usable.

- [ ] **Step 5: Commit**

```bash
git add src/index.css tailwind.config.js
git commit -m "chore: remove transitional design tokens and classes"
```
