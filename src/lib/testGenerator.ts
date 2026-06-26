import type { GeneratedTest, Question, TestQuestion } from "../types";
import { getQuestionsBySubject, getSubject } from "../data";
import { sample, shuffle } from "./shuffle";

export interface TestConfig {
  subjectIds: string[];
  /** Questions to draw per subject. Falls back to each subject's default. */
  perSubjectCount?: Record<string, number>;
}

function toTestQuestion(question: Question): TestQuestion {
  return {
    ...question,
    // Shuffle the options so answer positions differ between attempts.
    options: shuffle(question.options),
    multiCorrect: question.correctOptionIds.length > 1,
  };
}

/**
 * Builds a test by drawing questions from each requested subject, shuffling
 * both the question order and each question's options.
 */
export function buildTest(config: TestConfig): GeneratedTest {
  const picked: TestQuestion[] = [];

  for (const subjectId of config.subjectIds) {
    const subject = getSubject(subjectId);
    if (!subject) continue;

    const count =
      config.perSubjectCount?.[subjectId] ?? subject.defaultQuestionCount;
    const pool = getQuestionsBySubject(subjectId);
    const chosen = sample(pool, count).map(toTestQuestion);
    picked.push(...chosen);
  }

  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    subjectIds: config.subjectIds.slice(),
    questions: shuffle(picked),
  };
}
