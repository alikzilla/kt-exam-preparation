import { mutation, query } from "./_generated/server";
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
    const doc = await ctx.db
      .query("attempts")
      .withIndex("by_local", (q) => q.eq("localId", localId))
      .unique();
    if (!doc || doc.userId !== identity.subject) return null;
    return doc;
  },
});
