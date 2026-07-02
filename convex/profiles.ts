import { query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
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
