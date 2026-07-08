import type { GeneratedTest, Question, TestQuestion } from "../types";
import { getQuestionsBySubject, getSubject } from "../data";
import { sample, shuffle } from "./shuffle";

export interface TestConfig {
  subjectIds: string[];
  /** Questions to draw per subject. Falls back to each subject's default. */
  perSubjectCount?: Record<string, number>;
}

/**
 * Shuffles options and guarantees the result is not the original order, so an
 * answer never lands in its source position and positions can't be memorised
 * across attempts. A plain shuffle can, by chance, reproduce the input order
 * (probability 1/n!); this reshuffles until the layout actually changes.
 */
function shuffleOptions(options: Question["options"]): Question["options"] {
  if (options.length < 2) return options.slice();

  const isOriginalOrder = (candidate: Question["options"]) =>
    candidate.every((opt, i) => opt.id === options[i].id);

  let shuffled = shuffle(options);
  for (let tries = 0; tries < 8 && isOriginalOrder(shuffled); tries++) {
    shuffled = shuffle(options);
  }
  return shuffled;
}

function toTestQuestion(question: Question): TestQuestion {
  return {
    ...question,
    // Shuffle the options so answer positions differ between attempts.
    options: shuffleOptions(question.options),
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
