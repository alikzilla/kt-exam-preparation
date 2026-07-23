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
  textBased: v.optional(v.boolean()),
  passageId: v.optional(v.string()),
  multiCorrect: v.boolean(),
});

const generatedTest = v.object({
  id: v.string(),
  createdAt: v.number(),
  subjectIds: v.array(v.string()),
  questions: v.array(testQuestion),
});

// Поля баллов опциональны: попытки, сохранённые до подсчёта баллов, их не имеют.
const questionResult = v.object({
  questionId: v.string(),
  correct: v.boolean(),
  selectedOptionIds: v.array(v.string()),
  correctOptionIds: v.array(v.string()),
  pointsEarned: v.optional(v.number()),
  maxPoints: v.optional(v.number()),
});

const subjectScore = v.object({
  subjectId: v.string(),
  correct: v.number(),
  total: v.number(),
  points: v.optional(v.number()),
  maxPoints: v.optional(v.number()),
});

const gradeResult = v.object({
  correct: v.number(),
  total: v.number(),
  points: v.optional(v.number()),
  maxPoints: v.optional(v.number()),
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
