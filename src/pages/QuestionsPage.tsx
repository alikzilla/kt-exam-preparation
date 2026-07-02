import { useMemo, useState } from "react";
import type { Question } from "../types";
import {
  getAllQuestions,
  getQuestionsBySubject,
  getSubjectName,
  getSubjects,
} from "../data";
import OptionCard, { OPTION_LETTERS } from "../components/OptionCard";

/** Значение фильтра «Все» — не совпадает ни с одним subjectId. */
const ALL = "all";

export default function QuestionsPage() {
  const [subjectId, setSubjectId] = useState<string>(ALL);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const questions = useMemo<Question[]>(
    () =>
      subjectId === ALL ? getAllQuestions() : getQuestionsBySubject(subjectId),
    [subjectId]
  );

  const chips = useMemo(
    () => [
      { id: ALL, label: "Все", count: getAllQuestions().length },
      ...getSubjects().map((s) => ({
        id: s.id,
        label: s.name,
        count: getQuestionsBySubject(s.id).length,
      })),
    ],
    []
  );

  const allRevealed =
    questions.length > 0 && questions.every((q) => revealed.has(q.id));

  const toggleOne = (id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Глобальный тумблер действует только на вопросы текущего фильтра.
  const toggleAll = () => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (allRevealed) questions.forEach((q) => next.delete(q.id));
      else questions.forEach((q) => next.add(q.id));
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Банк вопросов{" "}
          <span className="tabular-nums text-ink-faint">
            ({questions.length})
          </span>
        </h1>
        <button type="button" onClick={toggleAll} className="btn-ghost btn-sm">
          {allRevealed ? "Скрыть все ответы" : "Показать все ответы"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSubjectId(c.id)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              subjectId === c.id
                ? "border-accent bg-accent/10 text-accent"
                : "border-line text-ink-soft hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {c.label}{" "}
            <span className="tabular-nums opacity-70">({c.count})</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const isRevealed = revealed.has(q.id);
          const multiCorrect = q.correctOptionIds.length > 1;
          const correctSet = new Set(q.correctOptionIds);
          return (
            <div key={q.id} className="surface p-5">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="font-semibold leading-snug text-ink">
                  <span className="tabular-nums text-ink-faint">{i + 1}.</span>{" "}
                  {q.text}
                </h3>
                <button
                  type="button"
                  onClick={() => toggleOne(q.id)}
                  className="btn-ghost btn-sm shrink-0"
                >
                  {isRevealed ? "Скрыть ответ" : "Показать ответ"}
                </button>
              </div>
              <div className="text-xs text-ink-faint">
                {getSubjectName(q.subjectId)}
              </div>

              <div className="mt-3 space-y-2">
                {q.options.map((opt, idx) => (
                  <OptionCard
                    key={opt.id}
                    option={opt}
                    letter={OPTION_LETTERS[idx]}
                    selected={false}
                    multiCorrect={multiCorrect}
                    disabled
                    variant={
                      isRevealed && correctSet.has(opt.id)
                        ? "correct"
                        : "default"
                    }
                  />
                ))}
              </div>

              {isRevealed && q.explanation && (
                <p className="mt-3 rounded-lg border-l-2 border-accent bg-surface-2 p-3 text-sm leading-relaxed text-ink-soft">
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
