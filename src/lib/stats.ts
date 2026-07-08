import { DEFAULT_PASS_THRESHOLD, type Attempt } from "../types";
import { scorePercent } from "./grading";

export interface DisciplineStat {
  subjectId: string;
  correct: number;
  total: number;
  percent: number;
}

export interface DashboardStats {
  totalAttempts: number;
  averagePercent: number;
  bestPercent: number;
  examsPassed: number;
  perDiscipline: DisciplineStat[];
  /** Проценты попыток в хронологическом порядке (старые → новые). */
  timeline: { takenAt: number; percent: number }[];
}

/** Points earned in a discipline, falling back to correct count for old attempts. */
export function subjectPoints(s: {
  points?: number;
  correct: number;
}): number {
  return s.points ?? s.correct;
}

function attemptPassed(a: Attempt): boolean {
  const threshold = a.passThreshold ?? DEFAULT_PASS_THRESHOLD;
  return (
    a.mode === "exam" &&
    a.result.perSubject.every((s) => subjectPoints(s) >= threshold)
  );
}

export function computeStats(attempts: Attempt[]): DashboardStats {
  const total = attempts.length;
  const percents = attempts.map((a) => scorePercent(a.result));
  const average =
    total > 0 ? Math.round(percents.reduce((s, p) => s + p, 0) / total) : 0;
  const best = total > 0 ? Math.max(...percents) : 0;

  const byDiscipline = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    for (const s of a.result.perSubject) {
      const e = byDiscipline.get(s.subjectId) ?? { correct: 0, total: 0 };
      e.correct += s.correct;
      e.total += s.total;
      byDiscipline.set(s.subjectId, e);
    }
  }
  const perDiscipline: DisciplineStat[] = Array.from(byDiscipline.entries()).map(
    ([subjectId, e]) => ({
      subjectId,
      correct: e.correct,
      total: e.total,
      percent: e.total > 0 ? Math.round((e.correct / e.total) * 100) : 0,
    })
  );

  const timeline = attempts
    .slice()
    .sort((a, b) => a.takenAt - b.takenAt)
    .map((a) => ({ takenAt: a.takenAt, percent: scorePercent(a.result) }));

  return {
    totalAttempts: total,
    averagePercent: average,
    bestPercent: best,
    examsPassed: attempts.filter(attemptPassed).length,
    perDiscipline,
    timeline,
  };
}
