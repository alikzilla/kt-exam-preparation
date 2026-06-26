import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { buildTest } from "../lib/testGenerator";
import type { ExamPreset } from "../data/exam";

/** Запуск экзамена по пресету и произвольной тренировки — единая логика. */
export function useStartTest() {
  const navigate = useNavigate();

  const startPreset = useCallback(
    (preset: ExamPreset) => {
      const perSubjectCount = Object.fromEntries(
        preset.disciplines.map((d) => [d.subjectId, d.count])
      );
      const test = buildTest({
        subjectIds: preset.disciplines.map((d) => d.subjectId),
        perSubjectCount,
      });
      if (test.questions.length === 0) return;
      navigate("/test", {
        state: {
          test,
          mode: "exam",
          durationSeconds: preset.durationMinutes * 60,
          examTitle: preset.title,
          passThreshold: preset.passThreshold,
        },
      });
    },
    [navigate]
  );

  const startPractice = useCallback(
    (
      subjectIds: string[],
      perSubjectCount: Record<string, number>,
      timed: boolean
    ) => {
      const test = buildTest({ subjectIds, perSubjectCount });
      if (test.questions.length === 0) return;
      const durationSeconds = timed ? test.questions.length * 120 : undefined;
      navigate("/test", {
        state: { test, mode: "practice", durationSeconds },
      });
    },
    [navigate]
  );

  return { startPreset, startPractice };
}
