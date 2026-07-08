import { describe, it, expect } from "vitest";
import { gradeTest, scorePercent } from "./grading";
import type { AnswerMap, GeneratedTest, TestQuestion } from "../types";

function q(id: string, subjectId: string, correct: string): TestQuestion {
  return {
    id,
    subjectId,
    text: id,
    options: [
      { id: "a", text: "a" },
      { id: "b", text: "b" },
    ],
    correctOptionIds: [correct],
    multiCorrect: false,
  };
}

/** A databases (2-point) question with `correct` correct options among a..d. */
function multiQ(id: string, correct: string[]): TestQuestion {
  return {
    id,
    subjectId: "databases",
    text: id,
    options: ["a", "b", "c", "d"].map((o) => ({ id: o, text: o })),
    correctOptionIds: correct,
    multiCorrect: correct.length > 1,
  };
}

function gradeOne(question: TestQuestion, selected: string[]) {
  const result = gradeTest(makeTest([question]), { [question.id]: selected });
  return result.perQuestion[0];
}

function makeTest(questions: TestQuestion[]): GeneratedTest {
  return {
    id: "t",
    createdAt: 0,
    subjectIds: [...new Set(questions.map((x) => x.subjectId))],
    questions,
  };
}

describe("gradeTest points weighting", () => {
  it("awards 2 points per correct question for databases and 1 for algorithms", () => {
    const test = makeTest([
      q("a1", "algorithms", "a"),
      q("a2", "algorithms", "a"),
      q("d1", "databases", "a"),
      q("d2", "databases", "a"),
    ]);
    const answers: AnswerMap = {
      a1: ["a"], // correct  → 1 pt
      a2: ["b"], // wrong
      d1: ["a"], // correct  → 2 pt
      d2: ["a"], // correct  → 2 pt
    };

    const result = gradeTest(test, answers);

    const algo = result.perSubject.find((s) => s.subjectId === "algorithms")!;
    const db = result.perSubject.find((s) => s.subjectId === "databases")!;

    expect(algo).toMatchObject({ correct: 1, total: 2, points: 1, maxPoints: 2 });
    expect(db).toMatchObject({ correct: 2, total: 2, points: 4, maxPoints: 4 });
    expect(result.points).toBe(5);
    expect(result.maxPoints).toBe(6);
  });

  it("caps a full 20-question databases discipline at 40 points", () => {
    const questions = Array.from({ length: 20 }, (_, i) =>
      q(`d${i}`, "databases", "a")
    );
    const answers: AnswerMap = Object.fromEntries(
      questions.map((x) => [x.id, ["a"]])
    );
    const result = gradeTest(makeTest(questions), answers);
    expect(result.maxPoints).toBe(40);
    expect(result.points).toBe(40);
  });

  describe("partial credit for multi-answer databases questions", () => {
    it("awards full 2 points when all correct answers are selected", () => {
      const r = gradeOne(multiQ("m", ["a", "b"]), ["a", "b"]);
      expect(r).toMatchObject({ pointsEarned: 2, maxPoints: 2, correct: true });
    });

    it("awards 1 point for exactly one mistake (a correct answer missed)", () => {
      const r = gradeOne(multiQ("m", ["a", "b"]), ["a"]);
      expect(r).toMatchObject({ pointsEarned: 1, correct: false });
    });

    it("awards 1 point for exactly one mistake (one extra wrong answer)", () => {
      const r = gradeOne(multiQ("m", ["a", "b"]), ["a", "b", "c"]);
      expect(r.pointsEarned).toBe(1);
    });

    it("awards 0 points for two or more mistakes", () => {
      // Missed both correct + picked one wrong = 3 mistakes.
      expect(gradeOne(multiQ("m", ["a", "b"]), ["c"]).pointsEarned).toBe(0);
      // Missed one correct + picked one wrong = 2 mistakes.
      expect(gradeOne(multiQ("m", ["a", "b"]), ["a", "c"]).pointsEarned).toBe(0);
    });

    it("awards 0 points for an unanswered question", () => {
      expect(gradeOne(multiQ("m", ["a", "b"]), []).pointsEarned).toBe(0);
    });
  });

  it("scorePercent is based on points, not question count", () => {
    // All algorithms wrong, all databases right: 4/6 questions but 8/... points.
    const test = makeTest([
      q("a1", "algorithms", "a"),
      q("a2", "algorithms", "a"),
      q("d1", "databases", "a"),
      q("d2", "databases", "a"),
    ]);
    const result = gradeTest(test, {
      a1: ["b"],
      a2: ["b"],
      d1: ["a"],
      d2: ["a"],
    });
    // points 4 / maxPoints 6 = 67%, whereas 2/4 questions would be 50%.
    expect(scorePercent(result)).toBe(67);
  });
});
