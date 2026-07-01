# Auth, Cloud Sync & Leaderboard (Clerk + Convex) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optional Clerk accounts with Convex-backed cloud attempt history, one-time local-data migration, streak tracking, a public leaderboard ranked by best exam score, and public profile pages. Guests keep the localStorage experience unchanged.

**Architecture:** Clerk (auth) + Convex (data), no self-hosted backend. Convex validates Clerk JWTs server-side (`ctx.auth.getUserIdentity()`), so ownership is enforced in Convex functions. A hook layer (`useAttempts`/`useAttempt`/`useSaveAttempt`) routes pages to localStorage (guest) or Convex (signed in). Spec: `docs/superpowers/specs/2026-07-02-auth-cloud-design.md`.

**Tech Stack:** React 18 + Vite 5 + TS, react-router-dom 6, `@clerk/clerk-react`, `convex` (+ `convex/react-clerk`), `convex-test` + `vitest` + `@edge-runtime/vm` for server-function tests.

## Global Constraints

- **Execute only after the UI redesign branch (`ui-redesign`) is fully complete** — all UI here uses the white/blue design system classes (`.surface`, `.btn-primary`, `btn-sm`, tokens `ink/ink-soft/ink-faint/accent/line/surface-2`).
- Guest behavior must not change: `src/lib/storage.ts` and localStorage key `kt-exam:attempts` stay untouched.
- Attempt ids: the client UUID (`Attempt.id`) is stored in Convex as `localId` and remains the id in `/results/:attemptId` routes for both storage paths.
- All UI copy Russian, verbatim as written here.
- Convex functions must never trust a client-supplied userId — always `ctx.auth.getUserIdentity()`.
- Signed-in reads use the rule **cloud ?? local** (a cloud miss falls back to localStorage) so pre-migration and offline-fallback data stays reachable.
- Leaderboard ranks `bestExamPercent` desc, ties by fewer `examAttempts`; only `isPublic && examAttempts > 0` profiles appear.
- Percent formula everywhere: `Math.round((correct / total) * 100)`, 0 when `total === 0` (matches `src/lib/grading.ts`'s `scorePercent`).
- TDD for all Convex functions: write the failing test first, then the implementation. UI-only steps have no test framework — their gate is `npm run build` (tsc + vite).
- After adding/changing anything in `convex/`, run `npx convex codegen` before building so `convex/_generated` is current. Commit `convex/_generated`.
- Each task ends with `npx vitest run` green (once tests exist), `npm run build` exit 0, and a commit whose message ends with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## Human Setup (before execution — cannot be automated)

1. **Clerk:** create an application at dashboard.clerk.com → copy the Publishable Key. Under *JWT Templates*, create a template named exactly `convex` (Convex preset) → copy the Issuer domain (looks like `https://xxx.clerk.accounts.dev`).
2. **Convex:** run `npx convex dev` once in the repo (interactive login) — it creates the project, writes `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL` into `.env.local`, and generates `convex/_generated`. Leave it stopped afterwards; tasks use `npx convex codegen` + `npx convex dev --once` to push.
3. **Convex dashboard:** set environment variable `CLERK_JWT_ISSUER_DOMAIN` = the Clerk issuer domain from step 1.
4. Add to `.env.local`: `VITE_CLERK_PUBLISHABLE_KEY=pk_test_...` (`.env.local` is already git-ignored via `*.local`).

---

### Task 1: Dependencies, providers, navbar auth UI

**Files:**
- Modify: `package.json` (deps + `test` script)
- Create: `convex/auth.config.ts`, `vitest.config.ts`, `.env.example`
- Modify: `src/main.tsx`, `src/components/Navbar.tsx`

**Interfaces:**
- Produces: app wrapped in `ClerkProvider` + `ConvexProviderWithClerk`; Clerk auth state available everywhere; `npm test` runs vitest. Later tasks import `useAuth`/`useUser` from `@clerk/clerk-react` and Convex hooks from `convex/react`.

- [ ] **Step 1: Install dependencies**

```bash
npm install convex @clerk/clerk-react
npm install -D convex-test vitest @edge-runtime/vm
```

(If npm reports `@clerk/clerk-react` deprecated in favor of `@clerk/react`, install that instead and use it in every import below — the exported API (`ClerkProvider`, `useAuth`, `useUser`, `SignedIn`, `SignedOut`, `SignInButton`, `UserButton`) is identical.)

- [ ] **Step 2: Add test script to `package.json`**

In `"scripts"`, add:

```json
    "test": "vitest run",
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    include: ["convex/**/*.test.ts"],
    server: { deps: { inline: ["convex-test"] } },
  },
});
```

- [ ] **Step 4: Create `convex/auth.config.ts`**

```ts
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};
```

- [ ] **Step 5: Create `.env.example`**

```
# Clerk publishable key (dashboard.clerk.com -> API Keys)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
# Convex deployment URL (written by `npx convex dev`)
VITE_CONVEX_URL=https://....convex.cloud
```

- [ ] **Step 6: Rewrite `src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import App from "./App.tsx";
import { ThemeProvider } from "./theme/ThemeProvider";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </React.StrictMode>
);
```

- [ ] **Step 7: Add auth controls to `src/components/Navbar.tsx`**

Add to the imports:

```tsx
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
```

Replace:

```tsx
        <div className="ml-auto">
          <ThemeToggle />
        </div>
```

with:

```tsx
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <SignedOut>
            <SignInButton mode="modal">
              <button type="button" className="btn-primary btn-sm">
                Войти
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
```

- [ ] **Step 8: Verify build**

Run: `npx convex codegen && npm run build`
Expected: exit 0.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts convex/auth.config.ts convex/_generated .env.example src/main.tsx src/components/Navbar.tsx
git commit -m "feat: add Clerk auth and Convex providers, navbar sign-in"
```

---

### Task 2: Schema + attempt functions (TDD)

**Files:**
- Create: `convex/schema.ts`, `convex/validators.ts`, `convex/attempts.ts`
- Test: `convex/attempts.test.ts`

**Interfaces:**
- Produces:
  - `api.attempts.saveAttempt({ attempt: AttemptFields })` — mutation, auth required
  - `api.attempts.myAttempts({})` — query, auth required, newest first
  - `api.attempts.getByLocalId({ localId: string })` — query, auth required, returns the caller's attempt doc or `null`
  - `AttemptFields` = the `Attempt` type minus `id`, plus `localId` (the former `id`)
  - `attemptValidator` exported from `convex/validators.ts` for reuse in Task 4
- Consumes: providers from Task 1.

- [ ] **Step 1: Create `convex/validators.ts`**

```ts
import { v } from "convex/values";

const questionOption = v.object({
  id: v.string(),
  text: v.string(),
});

const testQuestion = v.object({
  id: v.string(),
  subjectId: v.string(),
  text: v.string(),
  options: v.array(questionOption),
  correctOptionIds: v.array(v.string()),
  imageUrl: v.optional(v.string()),
  explanation: v.optional(v.string()),
  multiCorrect: v.boolean(),
});

const generatedTest = v.object({
  id: v.string(),
  createdAt: v.number(),
  subjectIds: v.array(v.string()),
  questions: v.array(testQuestion),
});

const questionResult = v.object({
  questionId: v.string(),
  correct: v.boolean(),
  selectedOptionIds: v.array(v.string()),
  correctOptionIds: v.array(v.string()),
});

const subjectScore = v.object({
  subjectId: v.string(),
  correct: v.number(),
  total: v.number(),
});

const gradeResult = v.object({
  correct: v.number(),
  total: v.number(),
  perQuestion: v.array(questionResult),
  perSubject: v.array(subjectScore),
});

/** Попытка в облаке: поля Attempt из src/types, где id переименован в localId. */
export const attemptValidator = v.object({
  localId: v.string(),
  takenAt: v.number(),
  mode: v.union(v.literal("exam"), v.literal("practice")),
  examTitle: v.optional(v.string()),
  passThreshold: v.optional(v.number()),
  test: generatedTest,
  answers: v.record(v.string(), v.array(v.string())),
  result: gradeResult,
});
```

- [ ] **Step 2: Create `convex/schema.ts`**

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { attemptValidator } from "./validators";

export default defineSchema({
  attempts: defineTable({
    userId: v.string(),
    ...attemptValidator.fields,
  })
    .index("by_user", ["userId", "takenAt"])
    .index("by_local", ["localId"]),

  profiles: defineTable({
    userId: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    bestExamPercent: v.number(),
    examAttempts: v.number(),
    lastStudyDay: v.string(),
    streakDays: v.number(),
    isPublic: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_best", ["bestExamPercent"]),
});
```

(The `profiles` table is defined now so the schema is stable; its functions arrive in Task 5.)

- [ ] **Step 3: Write failing tests `convex/attempts.test.ts`**

```ts
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function makeAttempt(localId: string, takenAt: number) {
  return {
    localId,
    takenAt,
    mode: "practice" as const,
    test: {
      id: `t-${localId}`,
      createdAt: takenAt,
      subjectIds: ["asd"],
      questions: [
        {
          id: "q1",
          subjectId: "asd",
          text: "2+2?",
          options: [
            { id: "o1", text: "4" },
            { id: "o2", text: "5" },
          ],
          correctOptionIds: ["o1"],
          multiCorrect: false,
        },
      ],
    },
    answers: { q1: ["o1"] },
    result: {
      correct: 1,
      total: 1,
      perQuestion: [
        {
          questionId: "q1",
          correct: true,
          selectedOptionIds: ["o1"],
          correctOptionIds: ["o1"],
        },
      ],
      perSubject: [{ subjectId: "asd", correct: 1, total: 1 }],
    },
  };
}

describe("attempts", () => {
  test("unauthenticated saveAttempt throws", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.attempts.saveAttempt, { attempt: makeAttempt("a1", 1) })
    ).rejects.toThrow();
  });

  test("myAttempts returns own attempts newest first", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    await asA.mutation(api.attempts.saveAttempt, {
      attempt: makeAttempt("a1", 100),
    });
    await asA.mutation(api.attempts.saveAttempt, {
      attempt: makeAttempt("a2", 200),
    });
    const list = await asA.query(api.attempts.myAttempts, {});
    expect(list.map((a) => a.localId)).toEqual(["a2", "a1"]);
  });

  test("users cannot see each other's attempts", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    const asB = t.withIdentity({ subject: "user_b", name: "B" });
    await asA.mutation(api.attempts.saveAttempt, {
      attempt: makeAttempt("a1", 100),
    });
    expect(await asB.query(api.attempts.myAttempts, {})).toEqual([]);
    expect(
      await asB.query(api.attempts.getByLocalId, { localId: "a1" })
    ).toBeNull();
    const own = await asA.query(api.attempts.getByLocalId, { localId: "a1" });
    expect(own?.localId).toBe("a1");
  });
});
```

- [ ] **Step 4: Run tests, expect failure**

Run: `npx convex codegen && npx vitest run`
Expected: FAIL — `api.attempts` does not exist yet.

- [ ] **Step 5: Create `convex/attempts.ts`**

```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { attemptValidator } from "./validators";

export const saveAttempt = mutation({
  args: { attempt: attemptValidator },
  handler: async (ctx, { attempt }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Требуется вход в аккаунт");
    await ctx.db.insert("attempts", { userId: identity.subject, ...attempt });
  },
});

export const myAttempts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("attempts")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const getByLocalId = query({
  args: { localId: v.string() },
  handler: async (ctx, { localId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const doc = await ctx.db
      .query("attempts")
      .withIndex("by_local", (q) => q.eq("localId", localId))
      .unique();
    if (!doc || doc.userId !== identity.subject) return null;
    return doc;
  },
});
```

- [ ] **Step 6: Run tests, expect pass**

Run: `npx convex codegen && npx vitest run`
Expected: 3/3 passing.

- [ ] **Step 7: Build and commit**

```bash
npm run build
git add convex/
git commit -m "feat: add Convex schema and attempt functions with ownership tests"
```

---

### Task 3: Hook layer + page switchover

**Files:**
- Create: `src/hooks/useAttempts.ts`
- Modify: `src/pages/DashboardPage.tsx`, `src/pages/HistoryPage.tsx`, `src/pages/ResultsPage.tsx`, `src/pages/TestPage.tsx`

**Interfaces:**
- Consumes: `api.attempts.*` from Task 2.
- Produces (from `src/hooks/useAttempts.ts`):
  - `useAttempts(): { attempts: Attempt[]; isLoading: boolean }`
  - `useAttempt(id: string | undefined): { attempt: Attempt | undefined; isLoading: boolean }`
  - `useSaveAttempt(): (attempt: Attempt) => Promise<void>`

- [ ] **Step 1: Create `src/hooks/useAttempts.ts`**

```ts
import { useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import type { Attempt } from "../types";
import {
  getAttempt as getLocalAttempt,
  loadAttempts as loadLocalAttempts,
  saveAttempt as saveLocalAttempt,
} from "../lib/storage";

/** Convex-документ -> Attempt (localId снова становится id). */
function docToAttempt(doc: Doc<"attempts">): Attempt {
  const { _id, _creationTime, userId, localId, ...rest } = doc;
  return { id: localId, ...rest };
}

/** История попыток: облако для вошедших, localStorage для гостей. */
export function useAttempts(): { attempts: Attempt[]; isLoading: boolean } {
  const { isSignedIn } = useAuth();
  const cloud = useQuery(api.attempts.myAttempts, isSignedIn ? {} : "skip");
  if (!isSignedIn) {
    return { attempts: loadLocalAttempts(), isLoading: false };
  }
  if (cloud === undefined) return { attempts: [], isLoading: true };
  return { attempts: cloud.map(docToAttempt), isLoading: false };
}

/** Одна попытка по id. Для вошедших: облако ?? localStorage (фолбэк). */
export function useAttempt(id: string | undefined): {
  attempt: Attempt | undefined;
  isLoading: boolean;
} {
  const { isSignedIn } = useAuth();
  const cloud = useQuery(
    api.attempts.getByLocalId,
    isSignedIn && id ? { localId: id } : "skip"
  );
  const local = id ? getLocalAttempt(id) : undefined;
  if (!isSignedIn) return { attempt: local, isLoading: false };
  if (cloud === undefined && local === undefined && id) {
    return { attempt: undefined, isLoading: true };
  }
  return {
    attempt: cloud ? docToAttempt(cloud) : local,
    isLoading: false,
  };
}

/** Сохранение попытки. Ошибка облака -> фолбэк в localStorage. */
export function useSaveAttempt(): (attempt: Attempt) => Promise<void> {
  const { isSignedIn } = useAuth();
  const save = useMutation(api.attempts.saveAttempt);
  return useCallback(
    async (attempt: Attempt) => {
      if (!isSignedIn) {
        saveLocalAttempt(attempt);
        return;
      }
      const { id, ...rest } = attempt;
      try {
        await save({ attempt: { localId: id, ...rest } });
      } catch {
        // Облако недоступно — сохраняем локально, useAttempt найдёт фолбэк.
        saveLocalAttempt(attempt);
      }
    },
    [isSignedIn, save]
  );
}
```

- [ ] **Step 2: Switch `src/pages/TestPage.tsx` to the hook**

Replace the import:

```tsx
import { saveAttempt } from "../lib/storage";
```

with:

```tsx
import { useSaveAttempt } from "../hooks/useAttempts";
```

Inside `TestRunner`, add after `const session = useTestSession(test);`:

```tsx
  const saveAttempt = useSaveAttempt();
```

and make `finish` await the save:

```tsx
  const finish = useCallback(() => {
    const result = gradeTest(test, session.answers);
    const attempt: Attempt = {
      id: crypto.randomUUID(),
      takenAt: Date.now(),
      mode,
      examTitle,
      passThreshold,
      test,
      answers: session.answers,
      result,
    };
    void saveAttempt(attempt).then(() => onSubmit(attempt));
  }, [test, mode, examTitle, passThreshold, session.answers, onSubmit, saveAttempt]);
```

- [ ] **Step 3: Switch `src/pages/DashboardPage.tsx`**

Replace:

```tsx
import { loadAttempts } from "../lib/storage";
```

with:

```tsx
import { useAttempts } from "../hooks/useAttempts";
```

Replace:

```tsx
  const attempts = useMemo(() => loadAttempts(), []);
```

with:

```tsx
  const { attempts, isLoading } = useAttempts();
```

and change the stats memo dependency accordingly (it already depends on `attempts`). Directly after the title-row `<div>` closes, add a loading gate before the stats section:

```tsx
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="surface h-24 animate-pulse p-5" />
          ))}
        </div>
      ) : (
        <>
```

and close the fragment `</>` + `)}` after the "Последние попытки" section (the whole data area is inside the conditional; the title row and "Начать экзамен" button stay outside it).

- [ ] **Step 4: Switch `src/pages/HistoryPage.tsx`**

Replace the storage import:

```tsx
import { clearAttempts, loadAttempts } from "../lib/storage";
```

with:

```tsx
import { clearAttempts } from "../lib/storage";
import { useAttempts } from "../hooks/useAttempts";
import { useAuth } from "@clerk/clerk-react";
```

Replace the state:

```tsx
  const [attempts, setAttempts] = useState(() => loadAttempts());
```

with:

```tsx
  const { isSignedIn } = useAuth();
  const { attempts: allAttempts, isLoading } = useAttempts();
  const [clearedLocal, setClearedLocal] = useState(false);
  const attempts = clearedLocal ? [] : allAttempts;
```

The `clear` handler becomes:

```tsx
  const clear = () => {
    clearAttempts();
    setClearedLocal(true);
    setConfirmOpen(false);
  };
```

Hide the "Очистить" button when signed in (cloud history has no delete in this scope) — wrap it:

```tsx
        {!isSignedIn && (
          <button ... >
            ...Очистить
          </button>
        )}
```

Add a loading state before the empty-state check:

```tsx
  if (isLoading) {
    return <div className="surface h-40 animate-pulse" />;
  }
```

- [ ] **Step 5: Switch `src/pages/ResultsPage.tsx`**

Replace:

```tsx
import { getAttempt } from "../lib/storage";
```

with:

```tsx
import { useAttempt } from "../hooks/useAttempts";
```

Replace:

```tsx
  const attempt = useMemo(
    () => (attemptId ? getAttempt(attemptId) : undefined),
    [attemptId]
  );

  if (!attempt) return <Navigate to="/" replace />;
```

with:

```tsx
  const { attempt, isLoading } = useAttempt(attemptId);

  if (isLoading) return <div className="surface h-40 animate-pulse" />;
  if (!attempt) return <Navigate to="/" replace />;
```

(Remove the now-unused `useMemo` import if nothing else in the file uses it.)

- [ ] **Step 6: Verify build**

Run: `npx convex codegen && npm run build && npx vitest run`
Expected: build exit 0, tests still 3/3.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useAttempts.ts src/pages/
git commit -m "feat: route attempt storage through cloud/local hook layer"
```

---

### Task 4: Migration of local attempts (TDD for server, then UI)

**Files:**
- Modify: `convex/attempts.ts`
- Create: `src/components/MigrationPrompt.tsx`
- Modify: `src/components/Layout.tsx`
- Test: `convex/attempts.test.ts` (extend)

**Interfaces:**
- Produces: `api.attempts.importAttempts({ attempts: AttemptFields[] })` — mutation, auth required, max 500 per call.
- Consumes: `attemptValidator`, `ConfirmDialog` (existing props: open/title/message/confirmLabel/cancelLabel/onConfirm/onCancel).

- [ ] **Step 1: Add failing tests to `convex/attempts.test.ts`**

```ts
  test("importAttempts bulk-inserts for the caller only", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    await asA.mutation(api.attempts.importAttempts, {
      attempts: [makeAttempt("m1", 10), makeAttempt("m2", 20)],
    });
    const list = await asA.query(api.attempts.myAttempts, {});
    expect(list).toHaveLength(2);
    const asB = t.withIdentity({ subject: "user_b", name: "B" });
    expect(await asB.query(api.attempts.myAttempts, {})).toEqual([]);
  });

  test("importAttempts rejects unauthenticated and >500 items", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.attempts.importAttempts, { attempts: [] })
    ).rejects.toThrow();
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    const many = Array.from({ length: 501 }, (_, i) =>
      makeAttempt(`x${i}`, i)
    );
    await expect(
      asA.mutation(api.attempts.importAttempts, { attempts: many })
    ).rejects.toThrow();
  });
```

Run: `npx vitest run` — expect the two new tests FAIL (`importAttempts` missing).

- [ ] **Step 2: Add `importAttempts` to `convex/attempts.ts`**

```ts
export const importAttempts = mutation({
  args: { attempts: v.array(attemptValidator) },
  handler: async (ctx, { attempts }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Требуется вход в аккаунт");
    if (attempts.length > 500) {
      throw new Error("Слишком много попыток за один импорт (макс. 500)");
    }
    for (const attempt of attempts) {
      await ctx.db.insert("attempts", {
        userId: identity.subject,
        ...attempt,
      });
    }
  },
});
```

Run: `npx convex codegen && npx vitest run` — all tests pass.

- [ ] **Step 3: Create `src/components/MigrationPrompt.tsx`**

```tsx
import { useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { clearAttempts, loadAttempts } from "../lib/storage";
import ConfirmDialog from "./ConfirmDialog";

const declineKey = (userId: string) => `kt-exam:migrate-declined:${userId}`;

/**
 * Разовое предложение перенести локальные попытки в аккаунт.
 * Показывается, если: вход выполнен, локально есть попытки,
 * в облаке пусто и пользователь ранее не отказывался.
 */
export default function MigrationPrompt() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const cloud = useQuery(api.attempts.myAttempts, isSignedIn ? {} : "skip");
  const importAttempts = useMutation(api.attempts.importAttempts);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isSignedIn || !user || dismissed) return null;
  if (cloud === undefined || cloud.length > 0) return null;

  const local = loadAttempts();
  if (local.length === 0) return null;
  if (localStorage.getItem(declineKey(user.id))) return null;

  const migrate = async () => {
    setBusy(true);
    try {
      const attempts = local.slice(0, 500).map(({ id, ...rest }) => ({
        localId: id,
        ...rest,
      }));
      await importAttempts({ attempts });
      clearAttempts();
    } finally {
      setBusy(false);
      setDismissed(true);
    }
  };

  const decline = () => {
    localStorage.setItem(declineKey(user.id), "1");
    setDismissed(true);
  };

  return (
    <ConfirmDialog
      open={!busy}
      title="Перенести локальные попытки?"
      message={`У вас ${local.length} локальных попыток. Перенести их в аккаунт, чтобы история была доступна на всех устройствах?`}
      confirmLabel="Перенести"
      cancelLabel="Не переносить"
      onConfirm={migrate}
      onCancel={decline}
    />
  );
}
```

- [ ] **Step 4: Render it in `src/components/Layout.tsx`**

Add `import MigrationPrompt from "./MigrationPrompt";` and render `<MigrationPrompt />` directly after `<Navbar />`.

- [ ] **Step 5: Verify and commit**

Run: `npx convex codegen && npm run build && npx vitest run`
Expected: build 0, 5/5 tests.

```bash
git add convex/ src/components/MigrationPrompt.tsx src/components/Layout.tsx
git commit -m "feat: one-time migration of local attempts to cloud account"
```

---

### Task 5: Profiles, best score, streak (TDD) + dashboard streak card

**Files:**
- Create: `convex/profiles.ts`
- Modify: `convex/attempts.ts` (saveAttempt/importAttempts update the profile)
- Modify: `src/pages/DashboardPage.tsx` (streak card)
- Test: `convex/profiles.test.ts`

**Interfaces:**
- Produces:
  - `api.attempts.saveAttempt` gains optional arg `localDay: v.optional(v.string())` (`YYYY-MM-DD`, client's local date) and upserts the caller's profile
  - `api.profiles.my({})` — query, auth required, returns own profile doc or `null`
  - internal helper `updateProfileAfterAttempts(ctx, identity, newAttempts, localDay?)` exported from `convex/profiles.ts` (plain function, not a Convex function)
- Consumes: schema `profiles` table from Task 2.
- Percent: `total === 0 ? 0 : Math.round((correct / total) * 100)`.
- Streak: same `lastStudyDay` → unchanged; exactly the next calendar day → `+1`; anything else → reset to 1. Import (`importAttempts`) updates best/count but never touches streak fields.

- [ ] **Step 1: Write failing tests `convex/profiles.test.ts`**

```ts
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function examAttempt(localId: string, correct: number, total: number) {
  return {
    localId,
    takenAt: 1,
    mode: "exam" as const,
    examTitle: "КТ",
    passThreshold: 7,
    test: { id: `t-${localId}`, createdAt: 1, subjectIds: ["asd"], questions: [] },
    answers: {},
    result: { correct, total, perQuestion: [], perSubject: [] },
  };
}

describe("profiles", () => {
  test("exam attempt updates best score and count; practice does not", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "Алия" });
    await asA.mutation(api.attempts.saveAttempt, {
      attempt: examAttempt("e1", 35, 50),
      localDay: "2026-07-01",
    });
    let p = await asA.query(api.profiles.my, {});
    expect(p?.bestExamPercent).toBe(70);
    expect(p?.examAttempts).toBe(1);
    expect(p?.name).toBe("Алия");

    await asA.mutation(api.attempts.saveAttempt, {
      attempt: examAttempt("e2", 20, 50),
      localDay: "2026-07-01",
    });
    p = await asA.query(api.profiles.my, {});
    expect(p?.bestExamPercent).toBe(70); // хуже — не меняется
    expect(p?.examAttempts).toBe(2);

    await asA.mutation(api.attempts.saveAttempt, {
      attempt: { ...examAttempt("p1", 50, 50), mode: "practice" as const },
      localDay: "2026-07-01",
    });
    p = await asA.query(api.profiles.my, {});
    expect(p?.bestExamPercent).toBe(70); // практика не считается
    expect(p?.examAttempts).toBe(2);
  });

  test("streak: same day keeps, next day increments, gap resets", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    const save = (id: string, day: string) =>
      asA.mutation(api.attempts.saveAttempt, {
        attempt: examAttempt(id, 10, 50),
        localDay: day,
      });
    await save("d1", "2026-07-01");
    await save("d2", "2026-07-01");
    let p = await asA.query(api.profiles.my, {});
    expect(p?.streakDays).toBe(1);
    await save("d3", "2026-07-02");
    p = await asA.query(api.profiles.my, {});
    expect(p?.streakDays).toBe(2);
    await save("d4", "2026-07-05");
    p = await asA.query(api.profiles.my, {});
    expect(p?.streakDays).toBe(1);
  });

  test("importAttempts updates best/count but not streak", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    await asA.mutation(api.attempts.importAttempts, {
      attempts: [examAttempt("i1", 45, 50)],
    });
    const p = await asA.query(api.profiles.my, {});
    expect(p?.bestExamPercent).toBe(90);
    expect(p?.examAttempts).toBe(1);
    expect(p?.streakDays).toBe(0);
  });
});
```

Run: `npx vitest run` — expect FAIL (`api.profiles` missing, `localDay` arg missing).

- [ ] **Step 2: Create `convex/profiles.ts`**

```ts
import { query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { UserIdentity } from "convex/server";

type AttemptLike = {
  mode: "exam" | "practice";
  result: { correct: number; total: number };
};

function percent(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

/** day2 — следующий календарный день после day1 (YYYY-MM-DD)? */
function isNextDay(day1: string, day2: string): boolean {
  const next = new Date(`${day1}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10) === day2;
}

/**
 * Обновляет профиль после сохранения попыток.
 * localDay передаётся только при «живом» сохранении — импорт не трогает серию.
 */
export async function updateProfileAfterAttempts(
  ctx: MutationCtx,
  identity: UserIdentity,
  newAttempts: AttemptLike[],
  localDay?: string
) {
  const userId = identity.subject;
  const existing = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

  const exams = newAttempts.filter((a) => a.mode === "exam");
  const newBest = exams.reduce(
    (b, a) => Math.max(b, percent(a.result.correct, a.result.total)),
    existing?.bestExamPercent ?? 0
  );
  const examAttempts = (existing?.examAttempts ?? 0) + exams.length;

  let lastStudyDay = existing?.lastStudyDay ?? "";
  let streakDays = existing?.streakDays ?? 0;
  if (localDay) {
    if (lastStudyDay === localDay) {
      // тот же день — серия не меняется
    } else if (lastStudyDay && isNextDay(lastStudyDay, localDay)) {
      streakDays += 1;
    } else {
      streakDays = 1;
    }
    lastStudyDay = localDay;
  }

  const fields = {
    name: identity.name ?? "Аноним",
    avatarUrl: identity.pictureUrl,
    bestExamPercent: newBest,
    examAttempts,
    lastStudyDay,
    streakDays,
  };

  if (existing) {
    await ctx.db.patch(existing._id, fields);
  } else {
    await ctx.db.insert("profiles", { userId, isPublic: true, ...fields });
  }
}

export const my = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
  },
});
```

- [ ] **Step 3: Wire it into `convex/attempts.ts`**

Add the import:

```ts
import { updateProfileAfterAttempts } from "./profiles";
```

`saveAttempt` gains the optional arg and the profile call:

```ts
export const saveAttempt = mutation({
  args: { attempt: attemptValidator, localDay: v.optional(v.string()) },
  handler: async (ctx, { attempt, localDay }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Требуется вход в аккаунт");
    await ctx.db.insert("attempts", { userId: identity.subject, ...attempt });
    await updateProfileAfterAttempts(ctx, identity, [attempt], localDay);
  },
});
```

`importAttempts` adds one call after the insert loop:

```ts
    await updateProfileAfterAttempts(ctx, identity, attempts);
```

- [ ] **Step 4: Run tests**

Run: `npx convex codegen && npx vitest run`
Expected: all tests pass (8 total).

- [ ] **Step 5: Send `localDay` from the client**

In `src/hooks/useAttempts.ts`, inside `useSaveAttempt`'s signed-in branch, replace:

```ts
        await save({ attempt: { localId: id, ...rest } });
```

with:

```ts
        const localDay = new Date().toLocaleDateString("sv-SE");
        await save({ attempt: { localId: id, ...rest }, localDay });
```

(`sv-SE` formats as `YYYY-MM-DD` in the user's local timezone.)

- [ ] **Step 6: Add the streak card to `src/pages/DashboardPage.tsx`**

Add imports:

```tsx
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
```

Inside the component:

```tsx
  const { isSignedIn } = useAuth();
  const profile = useQuery(api.profiles.my, isSignedIn ? {} : "skip");
```

In the stats grid, change the wrapper class to be conditional and append the fifth card:

```tsx
      <section
        className={`grid gap-4 sm:grid-cols-2 ${
          isSignedIn ? "lg:grid-cols-5" : "lg:grid-cols-4"
        }`}
      >
        ...four existing StatCards...
        {isSignedIn && (
          <StatCard label="Дней подряд" value={`${profile?.streakDays ?? 0}`} />
        )}
      </section>
```

- [ ] **Step 7: Verify and commit**

Run: `npx convex codegen && npm run build && npx vitest run`

```bash
git add convex/ src/hooks/useAttempts.ts src/pages/DashboardPage.tsx
git commit -m "feat: profiles with best exam score and study streak"
```

---

### Task 6: Leaderboard + public profiles + privacy toggle

**Files:**
- Modify: `convex/profiles.ts` (leaderboard, publicProfile, setPublic)
- Create: `src/pages/LeaderboardPage.tsx`, `src/pages/ProfilePage.tsx`
- Modify: `src/App.tsx` (routes), `src/components/Navbar.tsx` (link)
- Test: `convex/profiles.test.ts` (extend)

**Interfaces:**
- Produces:
  - `api.profiles.leaderboard({})` — public query → `{ userId, name, avatarUrl, bestExamPercent, examAttempts }[]` top 50, ordered best desc / examAttempts asc
  - `api.profiles.myRank({})` — auth query → `{ rank: number } | null` (null if hidden or no exams)
  - `api.profiles.publicProfile({ userId })` — public query → profile stats or `null` when hidden/absent
  - `api.profiles.setPublic({ isPublic })` — auth mutation
  - Routes `/leaderboard` and `/u/:userId`

- [ ] **Step 1: Add failing tests to `convex/profiles.test.ts`**

```ts
  test("leaderboard orders by best desc, ties by fewer exam attempts, hides private", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    const asB = t.withIdentity({ subject: "user_b", name: "B" });
    const asC = t.withIdentity({ subject: "user_c", name: "C" });

    await asA.mutation(api.attempts.saveAttempt, {
      attempt: examAttempt("a1", 40, 50), // 80%
    });
    await asB.mutation(api.attempts.saveAttempt, {
      attempt: examAttempt("b1", 40, 50), // 80% but 2 attempts
    });
    await asB.mutation(api.attempts.saveAttempt, {
      attempt: examAttempt("b2", 30, 50),
    });
    await asC.mutation(api.attempts.saveAttempt, {
      attempt: examAttempt("c1", 45, 50), // 90%
    });
    await asC.mutation(api.profiles.setPublic, { isPublic: false });

    const board = await t.query(api.profiles.leaderboard, {});
    expect(board.map((e) => e.userId)).toEqual(["user_a", "user_b"]);

    expect(await t.query(api.profiles.publicProfile, { userId: "user_c" }))
      .toBeNull();
    const a = await t.query(api.profiles.publicProfile, { userId: "user_a" });
    expect(a?.bestExamPercent).toBe(80);

    const rankB = await asB.query(api.profiles.myRank, {});
    expect(rankB?.rank).toBe(2);
  });
```

Run: `npx vitest run` — expect FAIL.

- [ ] **Step 2: Add the functions to `convex/profiles.ts`**

```ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
```

(merge with existing imports), then:

```ts
async function rankedProfiles(ctx: QueryCtx) {
  // Небольшая база: собираем всех публичных участников и сортируем в памяти.
  const all = await ctx.db
    .query("profiles")
    .withIndex("by_best")
    .order("desc")
    .collect();
  return all
    .filter((p) => p.isPublic && p.examAttempts > 0)
    .sort(
      (a, b) =>
        b.bestExamPercent - a.bestExamPercent ||
        a.examAttempts - b.examAttempts
    )
    .map((p) => ({
      userId: p.userId,
      name: p.name,
      avatarUrl: p.avatarUrl,
      bestExamPercent: p.bestExamPercent,
      examAttempts: p.examAttempts,
    }));
}

export const leaderboard = query({
  args: {},
  handler: async (ctx) => {
    return (await rankedProfiles(ctx)).slice(0, 50);
  },
});

export const myRank = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const ranked = await rankedProfiles(ctx);
    const i = ranked.findIndex((p) => p.userId === identity.subject);
    return i === -1 ? null : { rank: i + 1 };
  },
});

export const publicProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const p = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!p || !p.isPublic) return null;
    return {
      userId: p.userId,
      name: p.name,
      avatarUrl: p.avatarUrl,
      bestExamPercent: p.bestExamPercent,
      examAttempts: p.examAttempts,
      streakDays: p.streakDays,
    };
  },
});

export const setPublic = mutation({
  args: { isPublic: v.boolean() },
  handler: async (ctx, { isPublic }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Требуется вход в аккаунт");
    const p = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
    if (p) await ctx.db.patch(p._id, { isPublic });
  },
});
```

Run: `npx convex codegen && npx vitest run` — all pass.

- [ ] **Step 3: Create `src/pages/LeaderboardPage.tsx`**

```tsx
import { Link } from "react-router-dom";
import { useAuth, useUser, SignInButton } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function LeaderboardPage() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const board = useQuery(api.profiles.leaderboard, {});
  const myRank = useQuery(api.profiles.myRank, isSignedIn ? {} : "skip");

  if (board === undefined) {
    return <div className="surface h-40 animate-pulse" />;
  }

  const inTop = user && board.some((e) => e.userId === user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Лидерборд
      </h1>

      {!isSignedIn && (
        <p className="text-sm text-ink-soft">
          Лучшие результаты экзаменов.{" "}
          <SignInButton mode="modal">
            <button type="button" className="font-medium text-accent hover:underline">
              Войдите
            </button>
          </SignInButton>{" "}
          — и ваш результат появится здесь.
        </p>
      )}

      {board.length === 0 ? (
        <div className="surface p-10 text-center text-sm text-ink-soft">
          Пока никто не сдал экзамен. Будьте первым!
        </div>
      ) : (
        <ul className="surface divide-y divide-line">
          {board.map((e, i) => {
            const isMe = user?.id === e.userId;
            return (
              <li key={e.userId}>
                <Link
                  to={`/u/${e.userId}`}
                  className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-2 ${
                    isMe ? "bg-accent/5" : ""
                  }`}
                >
                  <span className="w-8 text-sm font-semibold tabular-nums text-ink-faint">
                    {i + 1}
                  </span>
                  {e.avatarUrl ? (
                    <img
                      src={e.avatarUrl}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink-soft">
                      {e.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="flex-1 truncate text-sm font-medium text-ink">
                    {e.name}
                    {isMe && <span className="text-ink-faint"> · вы</span>}
                  </span>
                  <span className="text-xs tabular-nums text-ink-faint">
                    {e.examAttempts} экз.
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-ink">
                    {e.bestExamPercent}%
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {isSignedIn && myRank && !inTop && (
        <p className="text-sm text-ink-soft">
          Ваше место: <span className="font-semibold tabular-nums text-ink">{myRank.rank}</span>
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `src/pages/ProfilePage.tsx`**

```tsx
import { useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import StatCard from "../components/StatCard";

export default function ProfilePage() {
  const { userId } = useParams();
  const { user } = useUser();
  const profile = useQuery(
    api.profiles.publicProfile,
    userId ? { userId } : "skip"
  );
  const own = useQuery(api.profiles.my, user?.id === userId ? {} : "skip");
  const setPublic = useMutation(api.profiles.setPublic);
  const isOwn = user?.id === userId;

  if (profile === undefined) {
    return <div className="surface h-40 animate-pulse" />;
  }

  const shown = profile ?? (isOwn ? own : null);
  if (!shown) {
    return (
      <div className="surface p-10 text-center text-sm text-ink-soft">
        Профиль скрыт или не найден.
      </div>
    );
  }

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

      {isOwn && own && (
        <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-surface-2">
          <input
            type="checkbox"
            checked={!own.isPublic}
            onChange={(e) => void setPublic({ isPublic: !e.target.checked })}
            className="h-4 w-4 accent-[rgb(var(--c-accent))]"
          />
          Скрыть меня из лидерборда
        </label>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Add routes and navbar link**

`src/App.tsx` — add imports and two routes:

```tsx
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
```

```tsx
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/u/:userId" element={<ProfilePage />} />
```

`src/components/Navbar.tsx` — extend the NAV array:

```tsx
const NAV = [
  { to: "/", label: "Дашборд", end: true },
  { to: "/tests", label: "Тесты", end: false },
  { to: "/history", label: "История", end: false },
  { to: "/leaderboard", label: "Лидерборд", end: false },
];
```

- [ ] **Step 6: Verify and commit**

Run: `npx convex codegen && npm run build && npx vitest run`

```bash
git add convex/ src/pages/LeaderboardPage.tsx src/pages/ProfilePage.tsx src/App.tsx src/components/Navbar.tsx
git commit -m "feat: leaderboard, public profiles, privacy toggle"
```

---

### Task 7: End-to-end verification

**Files:** none (verification only; fix regressions found).

- [ ] **Step 1: Full gates**

Run: `npx convex codegen && npm run build && npx vitest run`
Expected: build 0, all tests green.

- [ ] **Step 2: Push functions and run the app**

Run: `npx convex dev --once` (pushes schema + functions), then `npm run dev`.

- [ ] **Step 3: Manual checklist**

1. **Guest flow unchanged:** signed out, take a practice test → results page works, history/dashboard read localStorage; "Войти" button visible in navbar.
2. **Sign in** via the navbar modal → UserButton appears.
3. **Migration:** with local attempts present and an empty account, the prompt appears once; "Перенести" moves them (history shows them signed-in; localStorage emptied); on a fresh sign-in with "Не переносить", it never re-appears.
4. **Cloud sync:** take an exam signed in → it appears in history in a second browser/incognito signed into the same account.
5. **Streak card** shows on the dashboard for signed-in users.
6. **Leaderboard:** `/leaderboard` shows entries ordered by best %, own row highlighted; updates live when an exam finishes in another tab; guests see the sign-in hint.
7. **Profile:** click a leaderboard row → public stats; on own profile the "Скрыть меня из лидерборда" toggle removes you from the leaderboard (and `publicProfile` returns hidden for others).
8. **Offline fallback:** stop `npx convex dev`/disable network, finish a test signed in → results page still opens (local fallback).

- [ ] **Step 4: Commit any fixes**

If regressions were fixed, commit them:

```bash
git add -A && git commit -m "fix: address issues found in end-to-end verification"
```
