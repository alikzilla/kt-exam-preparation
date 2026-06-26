import type {
  AnswerMap,
  GeneratedTest,
  GradeResult,
  QuestionResult,
  SubjectScore,
} from "../types";

/** True when two sets of option ids contain exactly the same elements. */
function sameSelection(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((id) => setB.has(id));
}

/**
 * Grades a completed test. A question is correct only when the selected option
 * ids exactly match its correct option ids (set equality, so multi-correct
 * questions require every correct option and no extras).
 */
export function gradeTest(test: GeneratedTest, answers: AnswerMap): GradeResult {
  const perQuestion: QuestionResult[] = test.questions.map((q) => {
    const selected = answers[q.id] ?? [];
    return {
      questionId: q.id,
      selectedOptionIds: selected,
      correctOptionIds: q.correctOptionIds,
      correct: sameSelection(selected, q.correctOptionIds),
    };
  });

  const bySubject = new Map<string, SubjectScore>();
  for (const q of test.questions) {
    const entry =
      bySubject.get(q.subjectId) ??
      { subjectId: q.subjectId, correct: 0, total: 0 };
    entry.total += 1;
    bySubject.set(q.subjectId, entry);
  }
  for (const r of perQuestion) {
    const q = test.questions.find((tq) => tq.id === r.questionId)!;
    const entry = bySubject.get(q.subjectId)!;
    if (r.correct) entry.correct += 1;
  }

  const correct = perQuestion.filter((r) => r.correct).length;

  return {
    correct,
    total: test.questions.length,
    perQuestion,
    perSubject: Array.from(bySubject.values()),
  };
}

/** Percentage score (0-100), rounded. */
export function scorePercent(result: GradeResult): number {
  if (result.total === 0) return 0;
  return Math.round((result.correct / result.total) * 100);
}
