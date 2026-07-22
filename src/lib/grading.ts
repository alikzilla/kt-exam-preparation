import type {
  AnswerMap,
  GeneratedTest,
  GradeResult,
  QuestionResult,
  SubjectScore,
} from "../types";
import { getSubject } from "../data";

/** Points awarded per correct question in a discipline (defaults to 1). */
function pointsPerQuestion(subjectId: string): number {
  return getSubject(subjectId)?.pointsPerQuestion ?? 1;
}

/**
 * Number of mistakes between a selection and the correct answers: every correct
 * option that was missed plus every wrong option that was selected.
 */
function countMistakes(selected: string[], correct: string[]): number {
  const correctSet = new Set(correct);
  const selectedSet = new Set(selected);
  let mistakes = 0;
  for (const id of correct) if (!selectedSet.has(id)) mistakes += 1;
  for (const id of selected) if (!correctSet.has(id)) mistakes += 1;
  return mistakes;
}

/**
 * Points earned for a single question.
 *
 * For 2-point questions (the profile discipline «Базы данных», which may have
 * several correct answers) the official КТ rule gives partial credit by mistake
 * count: 2 points for a flawless answer, 1 point for exactly one mistake, and 0
 * for two or more. Any other weight is all-or-nothing.
 */
function pointsForQuestion(
  selected: string[],
  correct: string[],
  maxPoints: number
): number {
  const mistakes = countMistakes(selected, correct);
  if (maxPoints === 2) {
    if (selected.length === 0) return 0; // unanswered
    if (mistakes === 0) return 2;
    if (mistakes === 1) return 1;
    return 0;
  }
  return mistakes === 0 ? maxPoints : 0;
}

/**
 * Grades a completed test. A question counts as `correct` only when it earns
 * full marks (every correct option, no extras); the profile discipline can also
 * earn partial `pointsEarned` — see {@link pointsForQuestion}.
 */
export function gradeTest(test: GeneratedTest, answers: AnswerMap): GradeResult {
  const perQuestion: QuestionResult[] = test.questions.map((q) => {
    const selected = answers[q.id] ?? [];
    const maxPoints = pointsPerQuestion(q.subjectId);
    const pointsEarned = pointsForQuestion(selected, q.correctOptionIds, maxPoints);
    return {
      questionId: q.id,
      selectedOptionIds: selected,
      correctOptionIds: q.correctOptionIds,
      correct: pointsEarned === maxPoints,
      pointsEarned,
      maxPoints,
    };
  });

  const bySubject = new Map<string, SubjectScore>();
  test.questions.forEach((q, i) => {
    const r = perQuestion[i];
    const entry =
      bySubject.get(q.subjectId) ??
      { subjectId: q.subjectId, correct: 0, total: 0, points: 0, maxPoints: 0 };
    entry.total += 1;
    entry.maxPoints += r.maxPoints;
    entry.points += r.pointsEarned;
    if (r.correct) entry.correct += 1;
    bySubject.set(q.subjectId, entry);
  });

  const perSubject = Array.from(bySubject.values());
  const correct = perQuestion.filter((r) => r.correct).length;
  const points = perSubject.reduce((sum, s) => sum + s.points, 0);
  const maxPoints = perSubject.reduce((sum, s) => sum + s.maxPoints, 0);

  return {
    correct,
    total: test.questions.length,
    points,
    maxPoints,
    perQuestion,
    perSubject,
  };
}

/**
 * Percentage score (0-100), rounded. Based on points (so a 40-point discipline
 * weighs more than a 30-point one). Falls back to the correct/total ratio for
 * attempts saved before points were tracked.
 */
export function scorePercent(
  result: Pick<GradeResult, "correct" | "total" | "points" | "maxPoints">
): number {
  const maxPoints = result.maxPoints ?? 0;
  if (maxPoints > 0) return Math.round((result.points / maxPoints) * 100);
  if (result.total === 0) return 0;
  return Math.round((result.correct / result.total) * 100);
}
