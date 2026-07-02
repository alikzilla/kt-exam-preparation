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
});
