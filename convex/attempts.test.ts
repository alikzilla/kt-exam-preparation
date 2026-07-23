import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function makeAttempt(
  localId: string,
  takenAt: number,
  questionExtras: { textBased?: boolean; passageId?: string } = {}
) {
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
          ...questionExtras,
        },
      ],
    },
    answers: { q1: ["o1"] },
    result: {
      correct: 1,
      total: 1,
      points: 1,
      maxPoints: 1,
      perQuestion: [
        {
          questionId: "q1",
          correct: true,
          selectedOptionIds: ["o1"],
          correctOptionIds: ["o1"],
          pointsEarned: 1,
          maxPoints: 1,
        },
      ],
      perSubject: [
        { subjectId: "asd", correct: 1, total: 1, points: 1, maxPoints: 1 },
      ],
    },
  };
}

function makeExam(localId: string, takenAt: number) {
  return {
    ...makeAttempt(localId, takenAt),
    mode: "exam" as const,
    examTitle: "КТ",
    passThreshold: 7,
  };
}

describe("attempts", () => {
  test("unauthenticated saveAttempt throws", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.attempts.saveAttempt, { attempt: makeAttempt("a1", 1) })
    ).rejects.toThrow();
  });

  test("saveAttempt accepts text-based questions with passageId", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    const attempt = makeAttempt("a1", 100, { textBased: true, passageId: "p1" });
    await asA.mutation(api.attempts.saveAttempt, { attempt });
    const list = await asA.query(api.attempts.myAttempts, {});
    expect(list).toHaveLength(1);
    expect(list[0].test.questions[0].passageId).toBe("p1");
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

  test("publicExamAttempts returns exam summaries to strangers, newest first", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    await asA.mutation(api.attempts.saveAttempt, { attempt: makeExam("e1", 100) });
    await asA.mutation(api.attempts.saveAttempt, { attempt: makeExam("e2", 200) });
    await asA.mutation(api.attempts.saveAttempt, {
      attempt: makeAttempt("p1", 300), // practice — не публикуется
    });

    // Неавторизованный посетитель видит список
    const list = await t.query(api.attempts.publicExamAttempts, {
      userId: "user_a",
    });
    expect(list.map((a) => a.localId)).toEqual(["e2", "e1"]);
    // Только сводка — без теста, ответов и повопросных результатов
    expect(list[0]).not.toHaveProperty("test");
    expect(list[0]).not.toHaveProperty("answers");
    expect(list[0].result).not.toHaveProperty("perQuestion");
    expect(list[0].result.perSubject).toHaveLength(1);
    expect(list[0].examTitle).toBe("КТ");
  });

  test("publicExamAttempts hidden when examsPublic=false or isPublic=false; owner still sees", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    await asA.mutation(api.attempts.saveAttempt, { attempt: makeExam("e1", 100) });

    await asA.mutation(api.profiles.setExamsPublic, { examsPublic: false });
    expect(
      await t.query(api.attempts.publicExamAttempts, { userId: "user_a" })
    ).toEqual([]);
    expect(
      await asA.query(api.attempts.publicExamAttempts, { userId: "user_a" })
    ).toHaveLength(1); // владелец видит всегда

    await asA.mutation(api.profiles.setExamsPublic, { examsPublic: true });
    await asA.mutation(api.profiles.setPublic, { isPublic: false });
    expect(
      await t.query(api.attempts.publicExamAttempts, { userId: "user_a" })
    ).toEqual([]);
  });

  test("publicAttempt returns full doc for visible exams only", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    await asA.mutation(api.attempts.saveAttempt, { attempt: makeExam("e1", 100) });
    await asA.mutation(api.attempts.saveAttempt, { attempt: makeAttempt("p1", 200) });

    const doc = await t.query(api.attempts.publicAttempt, {
      userId: "user_a",
      localId: "e1",
    });
    expect(doc?.localId).toBe("e1");
    expect(doc?.test.questions).toHaveLength(1); // полный документ для разбора

    // Чужая тренировка недоступна, своя — доступна
    expect(
      await t.query(api.attempts.publicAttempt, {
        userId: "user_a",
        localId: "p1",
      })
    ).toBeNull();
    const own = await asA.query(api.attempts.publicAttempt, {
      userId: "user_a",
      localId: "p1",
    });
    expect(own?.localId).toBe("p1");

    // Скрытые экзамены недоступны чужим, но доступны владельцу
    await asA.mutation(api.profiles.setExamsPublic, { examsPublic: false });
    expect(
      await t.query(api.attempts.publicAttempt, {
        userId: "user_a",
        localId: "e1",
      })
    ).toBeNull();
    expect(
      (
        await asA.query(api.attempts.publicAttempt, {
          userId: "user_a",
          localId: "e1",
        })
      )?.localId
    ).toBe("e1");

    // Неизвестный id
    expect(
      await t.query(api.attempts.publicAttempt, {
        userId: "user_a",
        localId: "nope",
      })
    ).toBeNull();
  });

  test("publicAttempt and getByLocalId tolerate localId collisions across users", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    const asB = t.withIdentity({ subject: "user_b", name: "B" });
    await asA.mutation(api.attempts.saveAttempt, {
      attempt: makeExam("shared", 100),
    });
    await asB.mutation(api.attempts.saveAttempt, {
      attempt: makeAttempt("shared", 200),
    });

    const aDoc = await t.query(api.attempts.publicAttempt, {
      userId: "user_a",
      localId: "shared",
    });
    expect(aDoc?.userId).toBe("user_a");
    expect(aDoc?.localId).toBe("shared");

    // Пользователь B сохранил тренировку (не экзамен) — чужим недоступна
    expect(
      await t.query(api.attempts.publicAttempt, {
        userId: "user_b",
        localId: "shared",
      })
    ).toBeNull();

    const own = await asA.query(api.attempts.getByLocalId, {
      localId: "shared",
    });
    expect(own?.userId).toBe("user_a");
  });
});
