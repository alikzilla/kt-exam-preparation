# Exam questions grouped by discipline

**Date:** 2026-07-09
**Status:** Approved

## Problem

An exam draws questions from several disciplines (e.g. Профильный = Алгоритмы 30 +
Базы данных 20). Today `buildTest` flattens all disciplines into one list and
`shuffle()`s them together, so an algorithms question can sit between two database
questions. Users want the exam kept **grouped by discipline**, rendered group by
group, with a way to switch between groups.

## Decisions

- **Navigation model:** free tabs — one tab per discipline, jump between them at any
  time. One shared timer and one Finish for the whole exam (unchanged).
- **Scope:** grouping applies to any test with **2+ disciplines** (all exams and
  multi-subject practice). A single-discipline test renders exactly as today (one
  group, no tabs).
- **Within-group order:** questions inside a discipline stay randomized each attempt;
  option order stays randomized. Only cross-discipline interleaving is removed.

## Key insight

`buildTest` already builds questions **subject by subject** into `picked`
(`testGenerator.ts` loop over `subjectIds`). They are already grouped; the only thing
scrambling them across disciplines is the final `shuffle(picked)`. Within-subject
randomness comes from `sample()`, which is untouched.

## Changes

### 1. `src/lib/testGenerator.ts`
Replace `questions: shuffle(picked)` with `questions: picked`. Questions become
contiguous per-discipline blocks, still shuffled inside each block, options still
shuffled via `toTestQuestion`. `GeneratedTest` shape is unchanged, so grading,
storage, Convex, and the review screen need no changes. `shuffle` import stays (still
used by `toTestQuestion` via `./shuffle`); remove it from this file only if unused.

### 2. `src/lib/groups.ts` (new, pure + testable)
```ts
export interface QuestionGroup {
  subjectId: string;
  name: string;            // getSubjectName(subjectId)
  questions: TestQuestion[];
  startIndex: number;      // index of the group's first question in test.questions
}
export function groupQuestions(test: GeneratedTest): QuestionGroup[];
```
Walks `test.questions` and starts a new group whenever `subjectId` changes from the
previous question (consecutive-run grouping). Works for old saved attempts too. For a
single-discipline test it returns one group.

### 3. `src/pages/TestPage.tsx`
Keep the single flat `index` from `useTestSession` (timer, grading, Next/Prev/Finish,
progress, answered count all unchanged). Layer grouping on top:
- Compute `groups = groupQuestions(test)` (memoized).
- Derive `activeGroupIndex` from which group contains the current `index`.
- **Discipline tabs** above the navigator, shown only when `groups.length > 1`. Each
  tab shows the discipline `name` and its `answered/total`. Clicking a tab calls
  `session.goTo(group.startIndex)`.
- The **numbered navigator shows only the active group's questions**, numbered 1..N
  within the discipline, each button mapping to its global index via
  `startIndex + localIndex`.
- Header shows `Дисциплина k/K · Name` and `Вопрос j/N` within the discipline.
- The active tab follows `index` automatically, so Next flowing off the end of one
  discipline slides into the next; Finish still appears on the last question overall.

### 4. Tests
- `testGenerator`: a multi-discipline `buildTest` yields **contiguous, non-interleaved**
  discipline blocks in `subjectIds` order; counts per discipline are correct.
- `groups`: `groupQuestions` splits a multi-discipline test into the right groups with
  correct `startIndex`; a single-discipline test returns exactly one group.

## Out of scope
No schema/grading/storage/Convex changes. Review screen (`ResultsPage`) already lists
`test.questions` in order, which is now naturally grouped; no change needed.
