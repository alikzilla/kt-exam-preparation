# Auth, Cloud Sync & Leaderboard (Clerk + Convex)

**Date:** 2026-07-02
**Status:** Approved
**Depends on:** UI redesign (`2026-07-02-ui-redesign-design.md`) must be merged first — all new UI follows the white/blue design system.

## Goal

Add optional user accounts to the exam-prep app: signed-in users get cloud attempt history (cross-device), a one-time migration of local attempts, streak tracking, a public leaderboard, and public profile pages. Guests keep the current localStorage-only experience unchanged.

## Architecture

**Clerk** (auth) + **Convex** (data), no self-hosted backend.

- `@clerk/clerk-react` provides sign-in/sign-up UI and session state in the SPA.
- `convex` provides the database and server functions; Convex is configured with Clerk as its JWT identity provider, so every Convex function knows the verified `userId` server-side. Users can only write their own data.
- **Dual storage:** guests read/write attempts via the existing `src/lib/storage.ts` (localStorage) — that module does not change. Signed-in users read/write via Convex. A thin hook layer routes between the two based on Clerk auth state; pages consume the hooks and never touch storage directly.

## Convex Schema

### `attempts`
| Field | Type | Notes |
|---|---|---|
| `userId` | string | Clerk user id |
| `takenAt` | number | epoch ms |
| `mode` | `"exam" \| "practice"` | |
| `examTitle` | string? | exam mode only |
| `passThreshold` | number? | |
| `result` | object | `correct`, `total`, `perSubject[]`, `perQuestion[]` — same shape as the existing `Attempt.result` type |
| `test` | object | generated-test snapshot (same shape as `Attempt.test`) so the results/review page works from cloud data |

Index: `by_user` on `userId`.

### `profiles`
| Field | Type | Notes |
|---|---|---|
| `userId` | string | unique, Clerk user id |
| `name` | string | mirrored from Clerk on each save |
| `avatarUrl` | string? | mirrored from Clerk |
| `bestExamPercent` | number | 0 if no exam attempts yet |
| `examAttempts` | number | count of exam-mode attempts |
| `lastStudyDay` | string | `YYYY-MM-DD` in the user's local date, sent by the client |
| `streakDays` | number | consecutive study days |
| `isPublic` | boolean | default `true`; hidden profiles are excluded from leaderboard and profile pages |

Index: `by_user` on `userId`; `by_best` on `bestExamPercent`.

## Convex Server Functions

- `saveAttempt(attempt)` — mutation. Requires auth. Inserts the attempt with the caller's `userId` (ignores any client-supplied userId), then upserts the profile: recompute `bestExamPercent`/`examAttempts` if exam mode, update streak (`lastStudyDay` yesterday → `streakDays + 1`; today → unchanged; older → reset to 1), refresh `name`/`avatarUrl` from the Clerk identity.
- `importAttempts(attempts[])` — mutation. Requires auth. Bulk-inserts migrated local attempts for the caller and recomputes the profile once. Capped at 500 attempts per call.
- `myAttempts()` — query. Requires auth. Returns the caller's attempts, newest first.
- `getAttempt(id)` — query. Requires auth. Returns one attempt only if it belongs to the caller.
- `leaderboard(limit = 50)` — query. Public. Top public profiles with `examAttempts > 0`, ordered by `bestExamPercent` desc, ties by fewer `examAttempts`. Returns rank, name, avatarUrl, bestExamPercent, examAttempts, userId.
- `publicProfile(userId)` — query. Public. Returns name, avatarUrl, bestExamPercent, examAttempts, streakDays for a public profile; null otherwise.

## Frontend

### Providers & config
`main.tsx` wraps the app in `ClerkProvider` + `ConvexProviderWithClerk`. Keys come from `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CONVEX_URL` env vars (`.env.local`, git-ignored; `.env.example` documents them).

### Navbar
- Signed out: a "Войти" button (Clerk modal sign-in).
- Signed in: Clerk `<UserButton>` (avatar menu with sign-out and account management).
- New nav link "Лидерборд" → `/leaderboard`, visible to everyone.

### Storage hook layer (`src/hooks/`)
- `useAttempts()` → `{ attempts, isLoading }`. Signed out: localStorage (sync, `isLoading` always false). Signed in: Convex `myAttempts` (reactive).
- `useAttempt(id)` → single attempt for the results page, same routing rule.
- `useSaveAttempt()` → saves to localStorage or Convex `saveAttempt`. Signed-in saves also send the client's local `YYYY-MM-DD` for streak computation.
- Dashboard, History, and Results pages switch from direct `loadAttempts`/`getAttempt` calls to these hooks and render a lightweight loading state (skeleton cards) while Convex queries resolve.

### Migration prompt
On sign-in, if localStorage has ≥ 1 attempt and the account has 0 attempts, show a one-time `ConfirmDialog`: "Перенести N локальных попыток в аккаунт?" Confirm → `importAttempts`, then clear localStorage attempts. Decline → set a localStorage flag so the prompt never repeats for that account; local data stays local (guest mode continues to read it while signed out).

### Leaderboard page (`/leaderboard`)
Table: rank, avatar, name, best exam %, exam attempts. The signed-in user's own row is highlighted; if outside the top 50, their own rank/row shows pinned below the table. Rows link to `/u/:userId` profile pages. Live-updates via Convex reactivity. Guests can view; a hint invites them to sign in to participate.

### Profile page (`/u/:userId`)
Public stats only: avatar, name, best exam %, exam attempts, streak. Hidden/unknown profiles show "Профиль скрыт или не найден." A small "Скрыть меня из лидерборда" toggle appears on your own profile (writes `isPublic`).

### Streak on dashboard
The dashboard adds a fifth stat card "Дней подряд" for signed-in users (hidden for guests).

## Error handling

- Convex mutation failures (offline, etc.): the attempt is additionally written to localStorage as a fallback and a non-blocking toast/inline notice shows "Не удалось сохранить в облако — сохранено локально."
- Auth-required Convex calls are only made when Clerk reports `isSignedIn`; the hook layer guards this.

## Testing / verification

- `npm run build` stays the gate for TS correctness.
- Convex functions get unit coverage via `convex-test` (vitest) for: ownership enforcement, best-score/streak computation, leaderboard ordering and privacy filtering, import cap.
- Manual verification: guest flow unchanged; sign-in → migration prompt → history appears on a second browser; leaderboard updates live after finishing an exam.

## Known tradeoffs (accepted)

- **Client-side grading:** scores are computed in the browser and submitted; a motivated user could forge a leaderboard score. Accepted for now; later hardening would move the question bank and grading server-side.
- **Question bank ships in the client bundle** (unchanged from today).
- Decline-migration flag lives in localStorage, so declining on one device may re-prompt on another. Acceptable.

## Out of scope

- Server-side grading / anti-cheat.
- Social features (comments, friends), notifications, email.
- Admin tooling.
- Changing the guest experience in any way beyond the sign-in affordances.

## Rollout order

1. Clerk + Convex providers, env config, navbar auth UI.
2. Schema + `saveAttempt`/`myAttempts`/`getAttempt`, hook layer, page switchover, loading states.
3. Migration prompt + `importAttempts`.
4. Profiles upsert + streak + dashboard streak card.
5. Leaderboard page + public profile pages + privacy toggle.
