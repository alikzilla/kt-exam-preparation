import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function examAttempt(localId: string, correct: number, total: number) {
  return {
    localId,
    takenAt: 1,
    mode: "exam" as const,
    examTitle: "КТ",
    passThreshold: 7,
    test: { id: `t-${localId}`, createdAt: 1, subjectIds: ["asd"], questions: [] },
    answers: {},
    result: {
      correct,
      total,
      points: correct,
      maxPoints: total,
      perQuestion: [],
      perSubject: [],
    },
  };
}

describe("profiles", () => {
  test("exam attempt updates best score and count; practice does not", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "Алия" });
    await asA.mutation(api.attempts.saveAttempt, {
      attempt: examAttempt("e1", 35, 50),
      localDay: "2026-07-01",
    });
    let p = await asA.query(api.profiles.my, {});
    expect(p?.bestExamPercent).toBe(70);
    expect(p?.examAttempts).toBe(1);
    expect(p?.name).toBe("Алия");

    await asA.mutation(api.attempts.saveAttempt, {
      attempt: examAttempt("e2", 20, 50),
      localDay: "2026-07-01",
    });
    p = await asA.query(api.profiles.my, {});
    expect(p?.bestExamPercent).toBe(70); // хуже — не меняется
    expect(p?.examAttempts).toBe(2);

    await asA.mutation(api.attempts.saveAttempt, {
      attempt: { ...examAttempt("p1", 50, 50), mode: "practice" as const },
      localDay: "2026-07-01",
    });
    p = await asA.query(api.profiles.my, {});
    expect(p?.bestExamPercent).toBe(70); // практика не считается
    expect(p?.examAttempts).toBe(2);
  });

  test("streak: same day keeps, next day increments, gap resets", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    const save = (id: string, day: string) =>
      asA.mutation(api.attempts.saveAttempt, {
        attempt: examAttempt(id, 10, 50),
        localDay: day,
      });
    await save("d1", "2026-07-01");
    await save("d2", "2026-07-01");
    let p = await asA.query(api.profiles.my, {});
    expect(p?.streakDays).toBe(1);
    await save("d3", "2026-07-02");
    p = await asA.query(api.profiles.my, {});
    expect(p?.streakDays).toBe(2);
    await save("d4", "2026-07-05");
    p = await asA.query(api.profiles.my, {});
    expect(p?.streakDays).toBe(1);
  });

  test("importAttempts updates best/count but not streak", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    await asA.mutation(api.attempts.importAttempts, {
      attempts: [examAttempt("i1", 45, 50)],
    });
    const p = await asA.query(api.profiles.my, {});
    expect(p?.bestExamPercent).toBe(90);
    expect(p?.examAttempts).toBe(1);
    expect(p?.streakDays).toBe(0);
  });

  test("leaderboard orders by best desc, ties by fewer exam attempts, hides private", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    const asB = t.withIdentity({ subject: "user_b", name: "B" });
    const asC = t.withIdentity({ subject: "user_c", name: "C" });

    await asA.mutation(api.attempts.saveAttempt, {
      attempt: examAttempt("a1", 40, 50), // 80%
    });
    await asB.mutation(api.attempts.saveAttempt, {
      attempt: examAttempt("b1", 40, 50), // 80% but 2 attempts
    });
    await asB.mutation(api.attempts.saveAttempt, {
      attempt: examAttempt("b2", 30, 50),
    });
    await asC.mutation(api.attempts.saveAttempt, {
      attempt: examAttempt("c1", 45, 50), // 90%
    });
    await asC.mutation(api.profiles.setPublic, { isPublic: false });

    const board = await t.query(api.profiles.leaderboard, {});
    expect(board.map((e) => e.userId)).toEqual(["user_a", "user_b"]);

    expect(await t.query(api.profiles.publicProfile, { userId: "user_c" }))
      .toBeNull();
    const a = await t.query(api.profiles.publicProfile, { userId: "user_a" });
    expect(a?.bestExamPercent).toBe(80);

    const rankB = await asB.query(api.profiles.myRank, {});
    expect(rankB?.rank).toBe(2);
  });

  test("setExamsPublic toggles examsVisible; default is visible", async () => {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a", name: "A" });
    await asA.mutation(api.attempts.saveAttempt, {
      attempt: examAttempt("e1", 40, 50),
    });

    let p = await t.query(api.profiles.publicProfile, { userId: "user_a" });
    expect(p?.examsVisible).toBe(true); // examsPublic не задан — видимо по умолчанию

    await asA.mutation(api.profiles.setExamsPublic, { examsPublic: false });
    p = await t.query(api.profiles.publicProfile, { userId: "user_a" });
    expect(p?.examsVisible).toBe(false);

    await asA.mutation(api.profiles.setExamsPublic, { examsPublic: true });
    p = await t.query(api.profiles.publicProfile, { userId: "user_a" });
    expect(p?.examsVisible).toBe(true);
  });

  test("setExamsPublic requires auth", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.profiles.setExamsPublic, { examsPublic: false })
    ).rejects.toThrow();
  });
});
