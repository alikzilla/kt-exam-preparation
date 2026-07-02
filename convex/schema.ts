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
