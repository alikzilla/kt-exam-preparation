import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { UserIdentity } from "convex/server";
import { v } from "convex/values";

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
