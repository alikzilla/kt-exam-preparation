import { describe, it, expect } from "vitest";
import { buildTest } from "./testGenerator";
import { getQuestionsBySubject } from "../data";

describe("buildTest discipline grouping", () => {
  const cfg = {
    subjectIds: ["algorithms", "databases"],
    perSubjectCount: { algorithms: 5, databases: 4 },
  };

  it("keeps disciplines contiguous and in requested order (no interleaving)", () => {
    const test = buildTest(cfg);
    const seq = test.questions.map((q) => q.subjectId);

    // Blocks appear in the order they were requested...
    expect(seq[0]).toBe("algorithms");
    expect(seq[seq.length - 1]).toBe("databases");

    // ...and each discipline is a single contiguous run (no interleaving).
    const runs = seq.filter((s, i) => i === 0 || s !== seq[i - 1]);
    expect(runs).toEqual(["algorithms", "databases"]);
  });

  it("draws the requested number of questions per discipline", () => {
    const test = buildTest(cfg);
    const count = (id: string) =>
      test.questions.filter((q) => q.subjectId === id).length;
    expect(count("algorithms")).toBe(5);
    expect(count("databases")).toBe(4);
  });
});

describe("buildTest guaranteed SQL questions", () => {
  it("includes at least the configured minimum of SQL-query questions in the databases block", () => {
    // Full 20-question databases block; run several times since the draw is random.
    const cfg = { subjectIds: ["databases"], perSubjectCount: { databases: 20 } };
    for (let i = 0; i < 25; i++) {
      const test = buildTest(cfg);
      const sqlCount = test.questions.filter((q) => q.sqlQuery).length;
      expect(sqlCount).toBeGreaterThanOrEqual(4);
    }
  });

  it("does not exceed the block size when the block is smaller than the minimum", () => {
    const cfg = { subjectIds: ["databases"], perSubjectCount: { databases: 2 } };
    const test = buildTest(cfg);
    expect(test.questions).toHaveLength(2);
    // Every drawn question here should be an SQL one (min clamps to block size).
    expect(test.questions.every((q) => q.sqlQuery)).toBe(true);
  });
});

describe("buildTest text-based questions", () => {
  const cfg = { subjectIds: ["english"], perSubjectCount: { english: 50 } };

  it("pins text-based questions to the end of the block", () => {
    const test = buildTest(cfg);
    const flags = test.questions.map((q) => Boolean(q.textBased));
    const firstFlagged = flags.indexOf(true);
    expect(firstFlagged).toBeGreaterThan(0);
    // Once the text-based run starts, no regular question follows it.
    expect(flags.slice(firstFlagged)).not.toContain(false);
  });

  it("keeps text-based questions in bank order", () => {
    const test = buildTest(cfg);
    const pool = getQuestionsBySubject("english");
    const bankIndex = new Map(pool.map((q, i) => [q.id, i]));
    const flaggedIds = test.questions
      .filter((q) => q.textBased)
      .map((q) => bankIndex.get(q.id)!);
    expect(flaggedIds).toEqual([...flaggedIds].sort((a, b) => a - b));
  });
});
