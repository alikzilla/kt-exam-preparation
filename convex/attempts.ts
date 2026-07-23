import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { attemptValidator } from "./validators";
import { updateProfileAfterAttempts } from "./profiles";

export const saveAttempt = mutation({
  args: { attempt: attemptValidator, localDay: v.optional(v.string()) },
  handler: async (ctx, { attempt, localDay }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Требуется вход в аккаунт");
    await ctx.db.insert("attempts", { userId: identity.subject, ...attempt });
    await updateProfileAfterAttempts(ctx, identity, [attempt], localDay);
  },
});

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
    await updateProfileAfterAttempts(ctx, identity, attempts);
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
    const docs = await ctx.db
      .query("attempts")
      .withIndex("by_local", (q) => q.eq("localId", localId))
      .collect();
    return docs.find((d) => d.userId === identity.subject) ?? null;
  },
});

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
  args: { userId: v.string(), localId: v.string() },
  handler: async (ctx, { userId, localId }) => {
    const docs = await ctx.db
      .query("attempts")
      .withIndex("by_local", (q) => q.eq("localId", localId))
      .collect();
    const doc = docs.find((d) => d.userId === userId) ?? null;
    if (!doc) return null;
    const identity = await ctx.auth.getUserIdentity();
    const isOwner = identity?.subject === doc.userId;
    if (doc.mode !== "exam" && !isOwner) return null;
    if (!(await canViewExams(ctx, doc.userId))) return null;
    return doc;
  },
});
