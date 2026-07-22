# Public Exam Results Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let visitors see a user's exam results (chart, list, full per-question review) on their public profile, with a dedicated owner toggle to hide them.

**Architecture:** New optional `examsPublic` flag on `profiles` (undefined = visible), two gated public Convex queries (`attempts.publicExamAttempts` returning lightweight summaries, `attempts.publicAttempt` returning one full document), a shared `AttemptReview` component extracted from `ResultsPage`, and a new `/u/:userId/results/:localId` route.

**Tech Stack:** Convex (queries/mutations, convex-test), React + react-router-dom, Clerk auth, Tailwind, vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-22-public-exam-results-design.md`.
- Read `convex/_generated/ai/guidelines.md` before touching Convex code.
- Only `mode === "exam"` attempts are ever exposed to non-owners; practice attempts stay private.
- Visibility rule everywhere: viewer may see exams iff owner's profile has `isPublic && (examsPublic ?? true)`; the owner always sees their own.
- Public queries fail closed: `[]` / `null`, never a thrown error.
- All UI copy is Russian (matches existing pages).
- Tests: `npx vitest run` (convex tests live in `convex/*.test.ts` using `convex-test`).
- Existing behavior of `/results/:attemptId` must not change.

---

### Task 0: Commit pending working-tree changes

The repo has uncommitted, already-working changes (`convex/validators.ts` adds `textBased`/`passageId` to the question validator; `convex/attempts.test.ts` covers them). Commit them first so this feature's commits stay clean.

**Files:**
- Modify: none (commit only)

- [ ] **Step 1: Verify the pending changes pass**

Run: `npx vitest run`
Expected: all tests PASS.

- [ ] **Step 2: Commit them as their own commit**

```bash
git add convex/validators.ts convex/attempts.test.ts
git commit -m "feat: accept textBased/passageId fields in attempt validator"
```

---

### Task 1: Backend — `examsPublic` flag on profiles

**Files:**
- Modify: `convex/schema.ts` (profiles table)
- Modify: `convex/profiles.ts` (`publicProfile`, new `setExamsPublic`)
- Test: `convex/profiles.test.ts`

**Interfaces:**
- Produces: `profiles.setExamsPublic` mutation `{ examsPublic: boolean } -> null` (auth required); `profiles.publicProfile` return value gains `examsVisible: boolean` (`examsPublic ?? true`); `profiles` docs may have `examsPublic?: boolean`.

- [ ] **Step 1: Write the failing tests**

Append inside `describe("profiles", ...)` in `convex/profiles.test.ts`:

```ts
  test("setExamsPublic toggles examsVisible; default is visible", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    await asA.mutation(api.attempts.saveAttempt, {
      attempt: examAttempt("e1", 40, 50),
    });

    let p = await t.query(api.profiles.publicProfile, { userId: "user_a" });
    expect(p?.examsVisible).toBe(true); // examsPublic не задан — видимо по умолчанию

    await asA.mutation(api.profiles.setExamsPublic, { examsPublic: false });
    p = await t.query(api.profiles.publicProfile, { userId: "user_a" });
    expect(p?.examsVisible).toBe(false);

    await asA.mutation(api.profiles.setExamsPublic, { examsPublic: true });
    p = await t.query(api.profiles.publicProfile, { userId: "user_a" });
    expect(p?.examsVisible).toBe(true);
  });

  test("setExamsPublic requires auth", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.profiles.setExamsPublic, { examsPublic: false })
    ).rejects.toThrow();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run convex/profiles.test.ts`
Expected: FAIL — `api.profiles.setExamsPublic` does not exist / `examsVisible` undefined.

- [ ] **Step 3: Implement schema field and mutation**

In `convex/schema.ts`, add the field to the `profiles` table:

```ts
  profiles: defineTable({
    userId: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    bestExamPercent: v.number(),
    examAttempts: v.number(),
    lastStudyDay: v.string(),
    streakDays: v.number(),
    isPublic: v.boolean(),
    examsPublic: v.optional(v.boolean()),
  })
```

In `convex/profiles.ts`, extend `publicProfile`'s return object (inside the existing handler, after the `isPublic` check):

```ts
    return {
      userId: p.userId,
      name: p.name,
      avatarUrl: p.avatarUrl,
      bestExamPercent: p.bestExamPercent,
      examAttempts: p.examAttempts,
      streakDays: p.streakDays,
      examsVisible: p.examsPublic ?? true,
    };
```

Add below `setPublic` (mirrors it exactly):

```ts
export const setExamsPublic = mutation({
  args: { examsPublic: v.boolean() },
  handler: async (ctx, { examsPublic }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Требуется вход в аккаунт");
    const p = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (p) await ctx.db.patch(p._id, { examsPublic });
  },
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run convex/profiles.test.ts`
Expected: PASS (all, including pre-existing tests).

- [ ] **Step 5: Commit**

```bash
git add convex/schema.ts convex/profiles.ts convex/profiles.test.ts
git commit -m "feat: examsPublic profile flag with setExamsPublic mutation"
```

---

### Task 2: Backend — public attempt queries

**Files:**
- Modify: `convex/attempts.ts`
- Test: `convex/attempts.test.ts`

**Interfaces:**
- Consumes: `profiles` docs with `isPublic: boolean`, `examsPublic?: boolean` (Task 1).
- Produces:
  - `attempts.publicExamAttempts` query `{ userId: string } -> Array<{ localId: string; takenAt: number; examTitle?: string; passThreshold?: number; result: { correct: number; total: number; points: number; maxPoints: number; perSubject: Array<{ subjectId: string; correct: number; total: number; points: number; maxPoints: number }> } }>` — newest first, exam mode only, `[]` when hidden.
  - `attempts.publicAttempt` query `{ localId: string } -> Doc<"attempts"> | null` — full document, `null` when hidden/missing/foreign-practice.

- [ ] **Step 1: Write the failing tests**

Append inside `describe("attempts", ...)` in `convex/attempts.test.ts`. First add an exam helper next to `makeAttempt` (top of file, after `makeAttempt`):

```ts
function makeExam(localId: string, takenAt: number) {
  return {
    ...makeAttempt(localId, takenAt),
    mode: "exam" as const,
    examTitle: "КТ",
    passThreshold: 7,
  };
}
```

Then the tests:

```ts
  test("publicExamAttempts returns exam summaries to strangers, newest first", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    await asA.mutation(api.attempts.saveAttempt, { attempt: makeExam("e1", 100) });
    await asA.mutation(api.attempts.saveAttempt, { attempt: makeExam("e2", 200) });
    await asA.mutation(api.attempts.saveAttempt, {
      attempt: makeAttempt("p1", 300), // practice — не публикуется
    });

    // Неавторизованный посетитель видит список
    const list = await t.query(api.attempts.publicExamAttempts, {
      userId: "user_a",
    });
    expect(list.map((a) => a.localId)).toEqual(["e2", "e1"]);
    // Только сводка — без теста, ответов и повопросных результатов
    expect(list[0]).not.toHaveProperty("test");
    expect(list[0]).not.toHaveProperty("answers");
    expect(list[0].result).not.toHaveProperty("perQuestion");
    expect(list[0].result.perSubject).toHaveLength(1);
    expect(list[0].examTitle).toBe("КТ");
  });

  test("publicExamAttempts hidden when examsPublic=false or isPublic=false; owner still sees", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    await asA.mutation(api.attempts.saveAttempt, { attempt: makeExam("e1", 100) });

    await asA.mutation(api.profiles.setExamsPublic, { examsPublic: false });
    expect(
      await t.query(api.attempts.publicExamAttempts, { userId: "user_a" })
    ).toEqual([]);
    expect(
      await asA.query(api.attempts.publicExamAttempts, { userId: "user_a" })
    ).toHaveLength(1); // владелец видит всегда

    await asA.mutation(api.profiles.setExamsPublic, { examsPublic: true });
    await asA.mutation(api.profiles.setPublic, { isPublic: false });
    expect(
      await t.query(api.attempts.publicExamAttempts, { userId: "user_a" })
    ).toEqual([]);
  });

  test("publicAttempt returns full doc for visible exams only", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    await asA.mutation(api.attempts.saveAttempt, { attempt: makeExam("e1", 100) });
    await asA.mutation(api.attempts.saveAttempt, { attempt: makeAttempt("p1", 200) });

    const doc = await t.query(api.attempts.publicAttempt, { localId: "e1" });
    expect(doc?.localId).toBe("e1");
    expect(doc?.test.questions).toHaveLength(1); // полный документ для разбора

    // Чужая тренировка недоступна, своя — доступна
    expect(await t.query(api.attempts.publicAttempt, { localId: "p1" })).toBeNull();
    const own = await asA.query(api.attempts.publicAttempt, { localId: "p1" });
    expect(own?.localId).toBe("p1");

    // Скрытые экзамены недоступны чужим, но доступны владельцу
    await asA.mutation(api.profiles.setExamsPublic, { examsPublic: false });
    expect(await t.query(api.attempts.publicAttempt, { localId: "e1" })).toBeNull();
    expect(
      (await asA.query(api.attempts.publicAttempt, { localId: "e1" }))?.localId
    ).toBe("e1");

    // Неизвестный id
    expect(await t.query(api.attempts.publicAttempt, { localId: "nope" })).toBeNull();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run convex/attempts.test.ts`
Expected: FAIL — `api.attempts.publicExamAttempts` / `publicAttempt` do not exist.

- [ ] **Step 3: Implement the queries**

In `convex/attempts.ts`, change the server import to include `QueryCtx` and add helper + queries at the end of the file:

```ts
import type { QueryCtx } from "./_generated/server";
```

```ts
/** Можно ли зрителю видеть экзамены пользователя ownerId (владелец — всегда). */
async function canViewExams(ctx: QueryCtx, ownerId: string): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity?.subject === ownerId) return true;
  const p = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", ownerId))
    .unique();
  return !!p && p.isPublic && (p.examsPublic ?? true);
}

export const publicExamAttempts = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    if (!(await canViewExams(ctx, userId))) return [];
    const docs = await ctx.db
      .query("attempts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    // Сводки без содержимого теста: полный документ тяжёлый и раскрывает вопросы.
    return docs
      .filter((a) => a.mode === "exam")
      .map((a) => ({
        localId: a.localId,
        takenAt: a.takenAt,
        examTitle: a.examTitle,
        passThreshold: a.passThreshold,
        result: {
          correct: a.result.correct,
          total: a.result.total,
          points: a.result.points,
          maxPoints: a.result.maxPoints,
          perSubject: a.result.perSubject,
        },
      }));
  },
});

export const publicAttempt = query({
  args: { localId: v.string() },
  handler: async (ctx, { localId }) => {
    const doc = await ctx.db
      .query("attempts")
      .withIndex("by_local", (q) => q.eq("localId", localId))
      .unique();
    if (!doc) return null;
    const identity = await ctx.auth.getUserIdentity();
    const isOwner = identity?.subject === doc.userId;
    if (doc.mode !== "exam" && !isOwner) return null;
    if (!(await canViewExams(ctx, doc.userId))) return null;
    return doc;
  },
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run convex/attempts.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add convex/attempts.ts convex/attempts.test.ts
git commit -m "feat: public exam attempt queries gated by profile visibility"
```

---

### Task 3: Extract shared `AttemptReview` component

Pure refactor: move the summary card + per-question review out of `ResultsPage` into a reusable component. `/results/:attemptId` must look and behave exactly as before.

**Files:**
- Create: `src/components/AttemptReview.tsx`
- Modify: `src/pages/ResultsPage.tsx`

**Interfaces:**
- Produces: `AttemptReview` default-exported React component with props `{ attempt: Attempt; actions?: ReactNode }` — renders summary card (with `actions` in the footer when provided) and the per-question breakdown. `Attempt` is the existing type from `src/types`.

- [ ] **Step 1: Create `src/components/AttemptReview.tsx`**

The body is the existing markup from `ResultsPage.tsx` (everything after the loading/redirect guards), verbatim except: `attempt` comes from props, and the hardcoded buttons block is replaced with the `actions` slot.

```tsx
import type { ReactNode } from "react";
import { DEFAULT_PASS_THRESHOLD, type Attempt } from "../types";
import { scorePercent } from "../lib/grading";
import { subjectPoints } from "../lib/stats";
import { getSubjectName } from "../data";
import ScoreBadge from "./ScoreBadge";
import OptionCard, { OPTION_LETTERS } from "./OptionCard";
import PassageCard from "./PassageCard";
import MathText from "./MathText";
import { CheckIcon, CloseIcon } from "./icons";

/** Разбор попытки: сводка + ответы по вопросам. Используется на странице
 * собственных результатов и в публичном профиле. */
export default function AttemptReview({
  attempt,
  actions,
}: {
  attempt: Attempt;
  actions?: ReactNode;
}) {
  const { test, result, mode } = attempt;
  const percent = scorePercent(result);
  const threshold = attempt.passThreshold ?? DEFAULT_PASS_THRESHOLD;
  const resultById = new Map(result.perQuestion.map((r) => [r.questionId, r]));

  const isExam = mode === "exam";
  const disciplinePassed = (points: number) => points >= threshold;
  const passedExam =
    isExam && result.perSubject.every((s) => disciplinePassed(subjectPoints(s)));

  return (
    <div className="space-y-6">
      {/* ── Сводка ── */}
      <div className="surface p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
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
            {result.maxPoints > 0 && (
              <p className="mt-0.5 text-sm text-ink-soft">
                Баллов{" "}
                <span className="font-semibold tabular-nums text-ink">
                  {result.points}
                </span>{" "}
                из{" "}
                <span className="tabular-nums text-ink-soft">
                  {result.maxPoints}
                </span>
              </p>
            )}
          </div>
          <ScoreBadge percent={percent} />
        </div>

        {isExam && (
          <div
            className={`mt-5 flex items-center gap-3 rounded-lg px-4 py-3.5 ${
              passedExam
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                passedExam ? "bg-success/20" : "bg-danger/20"
              }`}
            >
              {passedExam ? (
                <CheckIcon className="h-4 w-4" strokeWidth={2.6} />
              ) : (
                <CloseIcon className="h-4 w-4" strokeWidth={2.6} />
              )}
            </div>
            <span className="text-sm font-semibold">
              {passedExam
                ? "Сдал — порог пройден по всем дисциплинам"
                : `Не сдал — нужно не менее ${threshold} баллов по каждой дисциплине`}
            </span>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {result.perSubject.map((s) => {
            const points = subjectPoints(s);
            const maxPoints = s.maxPoints ?? s.total;
            const passed = disciplinePassed(points);
            return (
              <div key={s.subjectId} className="surface-2 p-4">
                <div className="text-xs font-medium text-ink-soft">
                  {getSubjectName(s.subjectId)}
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-xl tabular-nums font-semibold text-ink">
                    {points}
                    <span className="text-ink-faint">/{maxPoints}</span>
                    <span className="ml-1 text-xs font-normal text-ink-faint">
                      балл · верно {s.correct}/{s.total}
                    </span>
                  </span>
                  {isExam && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        passed
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {passed ? "Порог пройден" : "Ниже порога"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
      </div>

      {/* ── Разбор ответов ── */}
      <div>
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">
          Ответы по вопросам
        </h2>
        <div className="space-y-4">
          {test.questions.map((q, i) => {
            const r = resultById.get(q.id);
            const selected = r?.selectedOptionIds ?? [];
            const correctSet = new Set(q.correctOptionIds);
            // Частичный зачёт (для профильной дисциплины): 0 < earned < maxPoints.
            const partial =
              r?.pointsEarned !== undefined &&
              r?.maxPoints !== undefined &&
              r.pointsEarned > 0 &&
              r.pointsEarned < r.maxPoints;
            return (
              <div key={q.id} className="surface p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="font-semibold leading-snug text-ink">
                    <span className="tabular-nums text-ink-faint">{i + 1}.</span>{" "}
                    <MathText text={q.text} />
                  </h3>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      r?.correct
                        ? "bg-success/10 text-success"
                        : partial
                          ? "bg-accent/10 text-accent"
                          : "bg-danger/10 text-danger"
                    }`}
                  >
                    {r?.correct ? (
                      <CheckIcon className="h-3 w-3" strokeWidth={2.8} />
                    ) : (
                      <CloseIcon className="h-3 w-3" strokeWidth={2.8} />
                    )}
                    {r?.correct
                      ? "Верно"
                      : partial
                        ? `Частично · ${r!.pointsEarned}/${r!.maxPoints}`
                        : "Неверно"}
                  </span>
                </div>
                <div className="text-xs text-ink-faint">
                  {getSubjectName(q.subjectId)}
                </div>

                {q.passageId && (
                  <div className="mt-3">
                    <PassageCard passageId={q.passageId} />
                  </div>
                )}
                {q.imageUrl && (
                  <img
                    src={q.imageUrl}
                    alt=""
                    className="mt-3 max-h-72 rounded-lg border border-line bg-white p-2"
                  />
                )}

                <div className="mt-3 space-y-2">
                  {q.options.map((opt, idx) => {
                    const isCorrect = correctSet.has(opt.id);
                    const isSelected = selected.includes(opt.id);
                    const variant = isCorrect
                      ? isSelected
                        ? "correct"
                        : "missed"
                      : isSelected
                        ? "incorrect"
                        : "default";
                    return (
                      <OptionCard
                        key={opt.id}
                        option={opt}
                        letter={OPTION_LETTERS[idx]}
                        selected={isSelected}
                        multiCorrect={q.multiCorrect}
                        disabled
                        variant={variant}
                      />
                    );
                  })}
                </div>

                {selected.length === 0 && (
                  <p className="mt-2 text-xs font-medium text-danger">
                    Без ответа
                  </p>
                )}

                {q.explanation && (
                  <p className="mt-3 rounded-lg border-l-2 border-accent bg-surface-2 p-3 text-sm leading-relaxed text-ink-soft">
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `src/pages/ResultsPage.tsx` as a thin wrapper**

Full replacement content:

```tsx
import { Link, Navigate, useParams } from "react-router-dom";
import { useAttempt } from "../hooks/useAttempts";
import AttemptReview from "../components/AttemptReview";
import Loader from "../components/Loader";
import { ArrowRightIcon, RefreshIcon } from "../components/icons";

export default function ResultsPage() {
  const { attemptId } = useParams();
  const { attempt, isLoading } = useAttempt(attemptId);

  if (isLoading) return <Loader label="Загружаем результаты…" />;
  if (!attempt) return <Navigate to="/" replace />;

  return (
    <AttemptReview
      attempt={attempt}
      actions={
        <>
          <Link to="/tests" className="btn-primary">
            <RefreshIcon className="h-4 w-4" />
            Новый тест
          </Link>
          <Link to="/" className="btn-secondary">
            На дашборд
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </>
      }
    />
  );
}
```

- [ ] **Step 3: Verify build and tests**

Run: `npm run build && npx vitest run`
Expected: build succeeds, all tests PASS. Visually the rendered markup is unchanged (same classes, same structure — the outer `space-y-6` wrapper now lives in `AttemptReview`).

- [ ] **Step 4: Commit**

```bash
git add src/components/AttemptReview.tsx src/pages/ResultsPage.tsx
git commit -m "refactor: extract AttemptReview from ResultsPage"
```

---

### Task 4: Public results page and route

**Files:**
- Create: `src/pages/PublicResultsPage.tsx`
- Modify: `src/App.tsx` (add route)
- Modify: `src/lib/grading.ts:104` (widen `scorePercent` param — needed by Task 5, done here so the file compiles once)

**Interfaces:**
- Consumes: `api.attempts.publicAttempt` (Task 2), `api.profiles.publicProfile` (Task 1), `AttemptReview` (Task 3).
- Produces: route `/u/:userId/results/:localId`; `scorePercent(result: Pick<GradeResult, "correct" | "total" | "points" | "maxPoints">): number`.

- [ ] **Step 1: Widen `scorePercent` signature**

In `src/lib/grading.ts` the function only reads `points`, `maxPoints`, `correct`, `total`, so accept exactly that (attempt summaries from `publicExamAttempts` lack `perQuestion`):

```ts
export function scorePercent(
  result: Pick<GradeResult, "correct" | "total" | "points" | "maxPoints">
): number {
```

Body unchanged. All existing callers pass a full `GradeResult`, which satisfies the `Pick`.

- [ ] **Step 2: Create `src/pages/PublicResultsPage.tsx`**

```tsx
import { Link, useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Attempt } from "../types";
import AttemptReview from "../components/AttemptReview";
import Loader from "../components/Loader";
import { ArrowLeftIcon } from "../components/icons";

export default function PublicResultsPage() {
  const { userId, localId } = useParams();
  const doc = useQuery(
    api.attempts.publicAttempt,
    localId ? { localId } : "skip"
  );
  const profile = useQuery(
    api.profiles.publicProfile,
    userId ? { userId } : "skip"
  );

  if (doc === undefined) return <Loader label="Загружаем результаты…" />;
  if (!doc || doc.userId !== userId) {
    return (
      <div className="surface p-10 text-center text-sm text-ink-soft">
        Результат скрыт или не найден.
      </div>
    );
  }

  const { _id, _creationTime, userId: owner, localId: lid, ...rest } = doc;
  const attempt: Attempt = { id: lid, ...rest };

  return (
    <div className="space-y-6">
      <Link
        to={`/u/${userId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {profile ? `Профиль: ${profile.name}` : "К профилю"}
      </Link>
      <AttemptReview
        attempt={attempt}
        actions={
          <Link to={`/u/${userId}`} className="btn-secondary">
            К профилю
          </Link>
        }
      />
    </div>
  );
}
```

Note the `doc.userId !== userId` guard: a valid `localId` under the wrong user's URL renders the hidden card instead of someone else's data with a mismatched back-link.

- [ ] **Step 3: Register the route**

In `src/App.tsx`: add the import and the route entry after `/u/:userId`:

```tsx
import PublicResultsPage from "./pages/PublicResultsPage";
```

```tsx
      { path: "/u/:userId", element: <ProfilePage /> },
      { path: "/u/:userId/results/:localId", element: <PublicResultsPage /> },
```

- [ ] **Step 4: Verify build and tests**

Run: `npm run build && npx vitest run`
Expected: build succeeds, all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/PublicResultsPage.tsx src/App.tsx src/lib/grading.ts
git commit -m "feat: public attempt review page at /u/:userId/results/:localId"
```

---

### Task 5: Profile page — exam section and visibility toggle

**Files:**
- Modify: `src/pages/ProfilePage.tsx` (full rewrite below)

**Interfaces:**
- Consumes: `api.attempts.publicExamAttempts` (Task 2 — summaries, newest first), `api.profiles.setExamsPublic` and `publicProfile.examsVisible` (Task 1), widened `scorePercent` (Task 4), existing `ScoreChart` (`{ data: { takenAt: number; percent: number }[] }`), `ScoreBadge`, `subjectPoints`, `getSubjectName`.

- [ ] **Step 1: Rewrite `src/pages/ProfilePage.tsx`**

Full replacement content:

```tsx
import { Link, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { scorePercent } from "../lib/grading";
import { subjectPoints } from "../lib/stats";
import { getSubjectName } from "../data";
import StatCard from "../components/StatCard";
import ScoreBadge from "../components/ScoreBadge";
import ScoreChart from "../components/ScoreChart";
import Loader from "../components/Loader";

export default function ProfilePage() {
  const { userId } = useParams();
  const { user } = useUser();
  const isOwn = user?.id === userId;
  const profile = useQuery(
    api.profiles.publicProfile,
    userId ? { userId } : "skip"
  );
  const own = useQuery(api.profiles.my, isOwn ? {} : "skip");
  const exams = useQuery(
    api.attempts.publicExamAttempts,
    userId ? { userId } : "skip"
  );
  const setPublic = useMutation(api.profiles.setPublic);
  const setExamsPublic = useMutation(api.profiles.setExamsPublic);

  if (profile === undefined) {
    return <Loader label="Загружаем профиль…" />;
  }

  const shown = profile ?? (isOwn ? own : null);
  if (!shown) {
    return (
      <div className="surface p-10 text-center text-sm text-ink-soft">
        Профиль скрыт или не найден.
      </div>
    );
  }

  // Экзамены скрыты для посторонних, если владелец выключил examsPublic.
  const examsHidden = !isOwn && profile !== null && !profile.examsVisible;
  const examList = exams ?? [];
  const chartData = examList
    .slice()
    .reverse()
    .map((a) => ({ takenAt: a.takenAt, percent: scorePercent(a.result) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {shown.avatarUrl ? (
          <img src={shown.avatarUrl} alt="" className="h-14 w-14 rounded-full" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-lg font-semibold text-ink-soft">
            {shown.name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {shown.name}
        </h1>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Лучший экзамен" value={`${shown.bestExamPercent}%`} />
        <StatCard label="Экзаменов сдано" value={`${shown.examAttempts}`} />
        <StatCard label="Дней подряд" value={`${shown.streakDays}`} />
      </section>

      {examsHidden ? (
        <div className="surface p-8 text-center text-sm text-ink-soft">
          Результаты экзаменов скрыты.
        </div>
      ) : (
        <>
          {chartData.length > 0 && (
            <section className="surface p-5">
              <h2 className="mb-3 text-sm font-semibold text-ink">
                Динамика экзаменов
              </h2>
              <ScoreChart data={chartData} />
            </section>
          )}

          {examList.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-ink">
                Экзамены{" "}
                <span className="tabular-nums text-ink-faint">
                  ({examList.length})
                </span>
              </h2>
              <ul className="space-y-3">
                {examList.map((a) => (
                  <li key={a.localId}>
                    <Link
                      to={`/u/${userId}/results/${a.localId}`}
                      className="surface-interactive flex items-center justify-between gap-3 p-4"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">
                          {a.examTitle ?? "Экзамен"}{" "}
                          <span className="tabular-nums text-ink-soft">
                            · {a.result.correct}/{a.result.total}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-xs tabular-nums text-ink-faint">
                          {new Date(a.takenAt).toLocaleString("ru-RU")} ·{" "}
                          {a.result.perSubject
                            .map(
                              (s) =>
                                `${getSubjectName(s.subjectId)} ${subjectPoints(s)}/${s.maxPoints ?? s.total}`
                            )
                            .join(", ")}
                        </div>
                      </div>
                      <ScoreBadge percent={scorePercent(a.result)} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {isOwn && own && (
        <div className="flex flex-wrap gap-3">
          <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-surface-2">
            <input
              type="checkbox"
              checked={!own.isPublic}
              onChange={(e) => void setPublic({ isPublic: !e.target.checked })}
              className="h-4 w-4 accent-[rgb(var(--c-accent))]"
            />
            Скрыть меня из лидерборда
          </label>
          <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-surface-2">
            <input
              type="checkbox"
              checked={!(own.examsPublic ?? true)}
              onChange={(e) =>
                void setExamsPublic({ examsPublic: !e.target.checked })
              }
              className="h-4 w-4 accent-[rgb(var(--c-accent))]"
            />
            Скрыть мои результаты экзаменов
          </label>
        </div>
      )}
    </div>
  );
}
```

Behavior notes baked into the code above:
- `examsHidden` is only true for strangers; the owner's own `publicExamAttempts` call returns data regardless (server-side owner check), so the owner previews their exams even while hidden.
- When a stranger views a hidden-exams profile, the queries return `[]`, and the "Результаты экзаменов скрыты." card shows.
- A public profile with zero exams shows neither chart nor list nor the hidden card (nothing to show — matches "no exams yet" being distinct from "hidden").

- [ ] **Step 2: Verify build and tests**

Run: `npm run build && npx vitest run`
Expected: build succeeds, all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ProfilePage.tsx
git commit -m "feat: exam results section and visibility toggle on profile page"
```
