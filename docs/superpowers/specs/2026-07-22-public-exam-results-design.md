# Public exam results with visibility toggle — Design

**Date:** 2026-07-22
**Status:** Approved

## Goal

Let visitors of a user's public profile (`/u/:userId`) see that user's exam
results — a score chart, a list of exam attempts, and the full per-question
review of any attempt — while giving each user a dedicated toggle to hide
their exam results independently of the existing "hide me from leaderboard"
toggle.

## Scope

- Only `mode === "exam"` attempts are ever exposed. Practice attempts stay
  private to their owner in all cases.
- Visibility is profile-level: one toggle covers all of a user's exams.
  No per-attempt visibility.
- Exam results are **visible by default**, consistent with profiles being
  public by default (`isPublic: true` on creation).

## Visibility rule (used everywhere)

A viewer may see a user's exam results when the owner's profile satisfies
`isPublic && (examsPublic ?? true)`. The owner always sees their own
attempts regardless of either flag.

## Backend (Convex)

### Schema

`profiles` gains `examsPublic: v.optional(v.boolean())`. `undefined` is
treated as `true`, so existing profile documents need no migration and
new profiles need no extra field on insert.

### `convex/profiles.ts`

- New mutation `setExamsPublic({ examsPublic: v.boolean() })` — requires
  auth, patches the caller's profile if it exists (mirrors `setPublic`).
- `publicProfile` additionally returns `examsVisible: boolean`
  (computed as `examsPublic ?? true`) so the profile page can distinguish
  "results hidden" from "no exams yet".

### `convex/attempts.ts`

- Shared helper `canViewExams(ctx, userId)`: returns true when the viewer
  is the owner, or when the owner's profile passes the visibility rule.
- New query `publicExamAttempts({ userId: v.string() })`:
  - Returns `[]` when the visibility check fails.
  - Reads via the existing `by_user` index, `order("desc")`, filters to
    `mode === "exam"`.
  - Maps each attempt to a lightweight summary:
    `{ localId, takenAt, examTitle, passThreshold, result: { correct,
    total, points, maxPoints, perSubject } }`.
    No `test`, no `answers`, no `perQuestion` — attempts embed the whole
    test (questions and correct answers), which is far too heavy for a
    list and leaks question content.
- New query `publicAttempt({ localId: v.string() })`:
  - Looks up via `by_local`; returns `null` if missing.
  - Returns `null` for practice attempts unless the viewer is the owner.
  - Returns `null` when the visibility check fails for the attempt's
    `userId`; otherwise returns the full document (the review page needs
    the test and per-question results).

## Frontend

### `ProfilePage` (`/u/:userId`)

Below the existing stat cards:

- **Score chart:** `ScoreChart` fed with `{ takenAt, percent }` points
  computed from the exam summaries (uses `scorePercent`-equivalent math on
  the summary result).
- **Exam list:** rows styled like `HistoryPage` items — exam title, date,
  score badge — each linking to `/u/:userId/results/:localId`.
- When the profile is public but `examsVisible` is false and the viewer is
  not the owner: a short "Результаты экзаменов скрыты" card replaces the
  section.
- **Owner controls:** a second checkbox next to the existing
  "Скрыть меня из лидерборда" — label "Скрыть мои результаты экзаменов",
  checked = `!(own.examsPublic ?? true)`, wired to `setExamsPublic`.

### `AttemptReview` component (extracted)

The summary card + per-question breakdown markup moves from `ResultsPage`
into `src/components/AttemptReview.tsx`, taking the attempt and an
optional `actions` slot (React node) rendered in the summary card.
`ResultsPage` keeps its "Новый тест / На дашборд" buttons by passing them
through the slot; behavior and appearance of `/results/:attemptId` are
unchanged.

### `PublicResultsPage` (new route `/u/:userId/results/:localId`)

- Queries `attempts.publicAttempt({ localId })`.
- Shows a back-to-profile link with the owner's name, then
  `AttemptReview` with a "К профилю" action.
- `null` result renders a "Результат скрыт или не найден" card (mirrors
  the profile-hidden state).

## Error handling

- All public queries fail closed: missing profile, private profile,
  hidden exams, or foreign practice attempts yield `[]` / `null`, never
  an error.
- Unauthenticated viewers can see public exam results (same as the
  leaderboard and public profiles today).

## Testing

`convex-test` suites alongside existing ones:

- `publicExamAttempts`: returns summaries (and only summary fields) for a
  public profile; excludes practice attempts; returns `[]` when
  `examsPublic` is false or `isPublic` is false; owner still gets results
  when hidden; `examsPublic: undefined` behaves as visible.
- `publicAttempt`: full doc for a visible exam; `null` for hidden
  profiles, unknown ids, and foreign practice attempts; owner can always
  load their own.
- `setExamsPublic`: round-trips the flag; requires auth.

Frontend verified with `npm run build` and the existing vitest suite.
