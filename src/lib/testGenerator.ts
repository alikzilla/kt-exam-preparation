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
 * Draws `count` questions from a subject's pool, guaranteeing at least
 * `minSql` of them are SQL-query questions (Question.sqlQuery) when the pool
 * has enough. SQL questions are drawn first, the rest fill from the remaining
 * (theory) pool, and the combined draw is reshuffled so the guaranteed SQL
 * questions land in random positions rather than clustered together.
 */
function drawQuestions(
  pool: readonly Question[],
  count: number,
  minSql: number
): Question[] {
  if (minSql <= 0) return sample(pool, count);

  const sqlPool = pool.filter((q) => q.sqlQuery);
  const rest = pool.filter((q) => !q.sqlQuery);
  const sqlCount = Math.min(minSql, sqlPool.length, count);
  const drawn = [...sample(sqlPool, sqlCount), ...sample(rest, count - sqlCount)];
  return shuffle(drawn);
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
    const drawn = drawQuestions(pool, count, subject.minSqlQuestions ?? 0);
    // Вопросы по тексту/аудио идут в конце блока в порядке банка (как в
    // реальном бланке), остальные остаются перемешанными после sample.
    const bankIndex = new Map(pool.map((q, i) => [q.id, i]));
    const regular = drawn.filter((q) => !q.textBased);
    const textBased = drawn
      .filter((q) => q.textBased)
      .sort((a, b) => bankIndex.get(a.id)! - bankIndex.get(b.id)!);
    picked.push(...[...regular, ...textBased].map(toTestQuestion));
  }

  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    subjectIds: config.subjectIds.slice(),
    // Keep disciplines as contiguous blocks (in requested order) so the exam can
    // be rendered group by group. Questions are already shuffled within each
    // block by `sample`, and options are shuffled per question by `toTestQuestion`.
    questions: picked,
  };
}
