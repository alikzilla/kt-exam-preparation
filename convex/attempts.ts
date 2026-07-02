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
