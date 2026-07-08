import { describe, it, expect } from "vitest";
import type { GeneratedTest, TestQuestion } from "../types";
import { groupQuestions } from "./groups";

function q(id: string, subjectId: string): TestQuestion {
  return {
    id,
    subjectId,
    text: id,
    options: [{ id: "a", text: "a" }],
    correctOptionIds: ["a"],
    multiCorrect: false,
  };
}

function makeTest(questions: TestQuestion[]): GeneratedTest {
  const subjectIds = [...new Set(questions.map((x) => x.subjectId))];
  return { id: "t", createdAt: 0, subjectIds, questions };
}

describe("groupQuestions", () => {
  it("splits a multi-discipline test into contiguous groups with correct startIndex", () => {
    const test = makeTest([
      q("a1", "algorithms"),
      q("a2", "algorithms"),
      q("d1", "databases"),
      q("d2", "databases"),
      q("d3", "databases"),
    ]);

    const groups = groupQuestions(test);

    expect(groups.map((g) => g.subjectId)).toEqual(["algorithms", "databases"]);
    expect(groups.map((g) => g.questions.length)).toEqual([2, 3]);
    expect(groups.map((g) => g.startIndex)).toEqual([0, 2]);
    expect(groups[1].questions.map((x) => x.id)).toEqual(["d1", "d2", "d3"]);
  });

  it("returns a single group for a single-discipline test", () => {
    const test = makeTest([q("a1", "algorithms"), q("a2", "algorithms")]);
    const groups = groupQuestions(test);
    expect(groups).toHaveLength(1);
    expect(groups[0].startIndex).toBe(0);
    expect(groups[0].questions).toHaveLength(2);
  });

  it("gives each group a human-readable discipline name", () => {
    const test = makeTest([q("a1", "algorithms")]);
    const [group] = groupQuestions(test);
    expect(group.name).toBe("Алгоритмы и структуры данных");
  });

  it("returns no groups for an empty test", () => {
    expect(groupQuestions(makeTest([]))).toEqual([]);
  });
});
