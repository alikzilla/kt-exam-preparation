import { useCallback, useMemo, useState } from "react";
import type { AnswerMap, GeneratedTest } from "../types";

/**
 * Holds the state of an in-progress test: the current question index and the
 * map of selected answers. Keeps TestPage thin.
 */
export function useTestSession(test: GeneratedTest) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});

  const current = test.questions[index];
  const total = test.questions.length;

  const select = useCallback(
    (questionId: string, optionId: string, multiCorrect: boolean) => {
      setAnswers((prev) => {
        const existing = prev[questionId] ?? [];
        let next: string[];
        if (multiCorrect) {
          next = existing.includes(optionId)
            ? existing.filter((id) => id !== optionId)
            : [...existing, optionId];
        } else {
          next = [optionId];
        }
        return { ...prev, [questionId]: next };
      });
    },
    []
  );

  const next = useCallback(
    () => setIndex((i) => Math.min(i + 1, total - 1)),
    [total]
  );
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
  const goTo = useCallback(
    (i: number) => setIndex(() => Math.min(Math.max(i, 0), total - 1)),
    [total]
  );

  const answeredCount = useMemo(
    () => Object.values(answers).filter((a) => a.length > 0).length,
    [answers]
  );

  return {
    index,
    current,
    total,
    answers,
    answeredCount,
    isFirst: index === 0,
    isLast: index === total - 1,
    select,
    next,
    prev,
    goTo,
  };
}
