# Questions Bank Page («Вопросы») Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only `/questions` page listing every question in the bank (80 questions, 3 subjects), with subject filter chips, per-question answer reveal, and a global «Показать все ответы» toggle.

**Architecture:** One new page component `QuestionsPage.tsx` that reads from the existing data registry (`src/data`) and reuses the existing `OptionCard` component for option rendering (its `"correct"` variant gives the same green highlight the results page uses). Route registered in `App.tsx`, nav link added in `Navbar.tsx`. No new state libraries, storage, or types.

**Tech Stack:** React 18, react-router-dom v6, Tailwind (custom component classes `surface`, `btn-ghost`, `btn-sm` from `src/index.css`). UI copy is Russian.

**Spec:** `docs/superpowers/specs/2026-07-02-questions-page-design.md`

## Global Constraints

- All user-facing copy in Russian (page title «Банк вопросов», nav item «Вопросы», buttons «Показать ответ» / «Скрыть ответ» / «Показать все ответы» / «Скрыть все ответы», filter chip «Все»).
- No automated test infrastructure exists in this project. Verification for every task = `npm run build` (runs `tsc -b && vite build`) passing, plus manual browser check in the final task.
- Read data only through `src/data` functions; do not import the question JSON files directly.
- Options render unshuffled, in JSON order, lettered with the existing Russian `OPTION_LETTERS` (А, Б, В, …).

---

### Task 1: QuestionsPage component

**Files:**
- Create: `src/pages/QuestionsPage.tsx`

**Interfaces:**
- Consumes: `getSubjects()`, `getAllQuestions()`, `getQuestionsBySubject(id)`, `getSubjectName(id)` from `src/data`; `OptionCard` (default export) and `OPTION_LETTERS` from `src/components/OptionCard`; `Question` type from `src/types`.
- Produces: `QuestionsPage` — default-exported React component with no props, rendered by the router in Task 2.

- [ ] **Step 1: Create the component**

Write `src/pages/QuestionsPage.tsx` with exactly this content:

```tsx
import { useMemo, useState } from "react";
import type { Question } from "../types";
import {
  getAllQuestions,
  getQuestionsBySubject,
  getSubjectName,
  getSubjects,
} from "../data";
import OptionCard, { OPTION_LETTERS } from "../components/OptionCard";

/** Значение фильтра «Все» — не совпадает ни с одним subjectId. */
const ALL = "all";

export default function QuestionsPage() {
  const [subjectId, setSubjectId] = useState<string>(ALL);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const questions = useMemo<Question[]>(
    () =>
      subjectId === ALL ? getAllQuestions() : getQuestionsBySubject(subjectId),
    [subjectId]
  );

  const chips = useMemo(
    () => [
      { id: ALL, label: "Все", count: getAllQuestions().length },
      ...getSubjects().map((s) => ({
        id: s.id,
        label: s.name,
        count: getQuestionsBySubject(s.id).length,
      })),
    ],
    []
  );

  const allRevealed =
    questions.length > 0 && questions.every((q) => revealed.has(q.id));

  const toggleOne = (id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Глобальный тумблер действует только на вопросы текущего фильтра.
  const toggleAll = () => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (allRevealed) questions.forEach((q) => next.delete(q.id));
      else questions.forEach((q) => next.add(q.id));
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Банк вопросов{" "}
          <span className="tabular-nums text-ink-faint">
            ({questions.length})
          </span>
        </h1>
        <button type="button" onClick={toggleAll} className="btn-ghost btn-sm">
          {allRevealed ? "Скрыть все ответы" : "Показать все ответы"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSubjectId(c.id)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              subjectId === c.id
                ? "border-accent bg-accent/10 text-accent"
                : "border-line text-ink-soft hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {c.label}{" "}
            <span className="tabular-nums opacity-70">({c.count})</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const isRevealed = revealed.has(q.id);
          const multiCorrect = q.correctOptionIds.length > 1;
          const correctSet = new Set(q.correctOptionIds);
          return (
            <div key={q.id} className="surface p-5">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="font-semibold leading-snug text-ink">
                  <span className="tabular-nums text-ink-faint">{i + 1}.</span>{" "}
                  {q.text}
                </h3>
                <button
                  type="button"
                  onClick={() => toggleOne(q.id)}
                  className="btn-ghost btn-sm shrink-0"
                >
                  {isRevealed ? "Скрыть ответ" : "Показать ответ"}
                </button>
              </div>
              <div className="text-xs text-ink-faint">
                {getSubjectName(q.subjectId)}
              </div>

              <div className="mt-3 space-y-2">
                {q.options.map((opt, idx) => (
                  <OptionCard
                    key={opt.id}
                    option={opt}
                    letter={OPTION_LETTERS[idx]}
                    selected={false}
                    multiCorrect={multiCorrect}
                    disabled
                    variant={
                      isRevealed && correctSet.has(opt.id)
                        ? "correct"
                        : "default"
                    }
                  />
                ))}
              </div>

              {isRevealed && q.explanation && (
                <p className="mt-3 rounded-lg border-l-2 border-accent bg-surface-2 p-3 text-sm leading-relaxed text-ink-soft">
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

Notes for the implementer:
- `OptionCard` with `variant="correct"` renders the green border/badge exactly as the results page review does; `variant="default"` + `disabled` renders a neutral non-interactive card.
- `multiCorrect` only controls the badge shape (square vs circle); `Question` has no `multiCorrect` field — it is derived from `correctOptionIds.length > 1`.

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: exits 0. (The page is not routed yet; TypeScript still checks the new file because `tsc -b` covers all of `src/`.)

- [ ] **Step 3: Commit**

```bash
git add src/pages/QuestionsPage.tsx
git commit -m "feat: add questions bank page component"
```

---

### Task 2: Route and navigation

**Files:**
- Modify: `src/App.tsx` (route list, lines 11–22)
- Modify: `src/components/Navbar.tsx` (NAV array, lines 4–8)

**Interfaces:**
- Consumes: `QuestionsPage` default export from `src/pages/QuestionsPage` (Task 1).
- Produces: route `/questions` and navbar link «Вопросы».

- [ ] **Step 1: Register the route in `src/App.tsx`**

Add the import:

```tsx
import QuestionsPage from "./pages/QuestionsPage";
```

Add the route entry after `/tests`, so the children array reads:

```tsx
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/tests", element: <TestsPage /> },
      { path: "/questions", element: <QuestionsPage /> },
      { path: "/test", element: <TestPage /> },
      { path: "/results/:attemptId", element: <ResultsPage /> },
      { path: "/history", element: <HistoryPage /> },
    ],
```

- [ ] **Step 2: Add the nav item in `src/components/Navbar.tsx`**

Update the `NAV` array to:

```tsx
const NAV = [
  { to: "/", label: "Дашборд", end: true },
  { to: "/tests", label: "Тесты", end: false },
  { to: "/questions", label: "Вопросы", end: false },
  { to: "/history", label: "История", end: false },
];
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/Navbar.tsx
git commit -m "feat: wire questions page into router and navbar"
```

---

### Task 3: Manual verification

**Files:** none (verification only).

**Interfaces:**
- Consumes: the running app with Tasks 1–2 applied.
- Produces: confirmation the feature matches the spec.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` and open the printed URL (default `http://localhost:5173`).

- [ ] **Step 2: Check against the spec**

- Navbar shows «Вопросы» between «Тесты» and «История»; clicking it opens `/questions` and the link gets the active accent style.
- Header reads «Банк вопросов (80)»; chips read «Все (80)», «Алгоритмы… (30)», «Базы данных… (20)», «…готовность… (30)» (exact subject names come from `src/data/subjects.ts`).
- Clicking a subject chip filters the list and updates the header count; question numbering restarts from 1.
- «Показать ответ» on one card highlights only its correct option(s) in green and shows the explanation below; clicking again hides it.
- «Показать все ответы» reveals every card in the current filter and the button label flips to «Скрыть все ответы»; with a subject filter active it only affects that subject's questions.
- Toggle dark theme: cards, chips, and the green correct highlight remain legible.

- [ ] **Step 3: Stop the dev server**

No commit — nothing changed.
