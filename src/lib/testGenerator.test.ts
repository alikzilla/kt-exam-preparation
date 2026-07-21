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
