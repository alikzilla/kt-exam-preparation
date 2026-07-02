# Questions Bank Page («Вопросы») — Design

**Date:** 2026-07-02
**Status:** Approved

## Goal

Add a read-only page that lists every question in the app's question bank (currently 80 questions across 3 subjects), so the user can browse and study them outside of a test session.

## Route & Navigation

- New route `/questions` registered in `src/App.tsx` under the shared `Layout`.
- New nav item «Вопросы» in `src/components/Navbar.tsx`, placed between «Тесты» and «История».
- One new file: `src/pages/QuestionsPage.tsx`. No other new components.

## Page Layout

- **Header:** «Банк вопросов» with the total visible count in the existing faint `(N)` style (as on HistoryPage). On the right: a ghost button toggling «Показать все ответы» / «Скрыть все ответы».
- **Filter chips:** a row below the header — «Все» plus one chip per subject from `getSubjects()`, each showing its question count. Exactly one chip active at a time; «Все» is the default.
- **Question list:** vertical list of `surface` cards. Each card shows:
  - question number (position within the current filter) and question text;
  - the options as a plain lettered list (a–e), unshuffled, straight from the JSON;
  - a small «Показать ответ» / «Скрыть ответ» toggle button.

## Reveal Behavior

- **Per-card reveal:** clicking the button highlights the correct option(s) — success tint plus check mark, reusing the visual idiom ResultsPage uses for correct answers — and shows the `explanation` (if present) below the options in soft ink.
- **Global toggle:** «Показать все ответы» adds all currently filtered question ids to the revealed set; «Скрыть все ответы» clears them. Button label reflects whether all filtered questions are currently revealed.
- **State:** a single `Set<questionId>` of revealed cards, plus the active subject filter. Plain `useState`, no persistence.

## Data

- Read-only access via `getAllQuestions()` / `getQuestionsBySubject()` / `getSubjects()` from `src/data`.
- No localStorage, no new types, no changes to `lib/` code.

## Error Handling

None beyond the trivial case: with current data every subject has questions, and the «Все» chip always has content. If a subject ever has zero questions, its chip simply shows `(0)` and the list renders empty.

## Testing / Verification

The project has no automated test setup. Verification is:

1. `npx tsc -b` (or the project build) passes.
2. Manual check in the browser: navigation, filtering, per-card reveal, global toggle, dark theme.
