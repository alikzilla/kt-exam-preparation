import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { DEFAULT_PASS_THRESHOLD } from "../types";
import { getAttempt } from "../lib/storage";
import { scorePercent } from "../lib/grading";
import { getSubjectName } from "../data";
import ScoreBadge from "../components/ScoreBadge";
import OptionCard, { OPTION_LETTERS } from "../components/OptionCard";

const surface =
  "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

export default function ResultsPage() {
  const { attemptId } = useParams();
  const attempt = useMemo(
    () => (attemptId ? getAttempt(attemptId) : undefined),
    [attemptId]
  );

  if (!attempt) return <Navigate to="/" replace />;

  const { test, result, mode } = attempt;
  const percent = scorePercent(result);
  const threshold = attempt.passThreshold ?? DEFAULT_PASS_THRESHOLD;
  const resultById = new Map(result.perQuestion.map((r) => [r.questionId, r]));

  const isExam = mode === "exam";
  const disciplinePassed = (correct: number) => correct >= threshold;
  const passedExam =
    isExam && result.perSubject.every((s) => disciplinePassed(s.correct));

  return (
    <div className="space-y-6">
      <div className={`${surface} p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isExam ? (attempt.examTitle ?? "Экзамен") : "Тренировка"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Правильных {result.correct} из {result.total}
            </p>
          </div>
          <ScoreBadge percent={percent} />
        </div>

        {isExam && (
          <div
            className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
              passedExam
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
            }`}
          >
            {passedExam
              ? "Сдал — порог пройден по всем дисциплинам"
              : `Не сдал — нужно не менее ${threshold} баллов по каждой дисциплине`}
          </div>
        )}

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {result.perSubject.map((s) => {
            const passed = disciplinePassed(s.correct);
            return (
              <div
                key={s.subjectId}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {getSubjectName(s.subjectId)}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">
                    {s.correct}/{s.total}
                  </span>
                  {isExam && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        passed
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
                      }`}
                    >
                      {passed ? "Порог пройден" : "Ниже порога"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            to="/tests"
            className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white transition hover:bg-indigo-700"
          >
            Новый тест
          </Link>
          <Link
            to="/"
            className="rounded-lg border border-slate-300 px-5 py-2 font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            На дашборд
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
          Разбор ответов
        </h2>
        <div className="space-y-4">
          {test.questions.map((q, i) => {
            const r = resultById.get(q.id);
            const selected = r?.selectedOptionIds ?? [];
            const correctSet = new Set(q.correctOptionIds);
            return (
              <div key={q.id} className={`${surface} p-5`}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {i + 1}. {q.text}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      r?.correct
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
                    }`}
                  >
                    {r?.correct ? "Верно" : "Неверно"}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {getSubjectName(q.subjectId)}
                </div>

                <div className="mt-3 space-y-2">
                  {q.options.map((opt, idx) => {
                    const isCorrect = correctSet.has(opt.id);
                    const isSelected = selected.includes(opt.id);
                    const variant = isCorrect
                      ? isSelected
                        ? "correct"
                        : "missed"
                      : isSelected
                        ? "incorrect"
                        : "default";
                    return (
                      <OptionCard
                        key={opt.id}
                        option={opt}
                        letter={OPTION_LETTERS[idx]}
                        selected={isSelected}
                        multiCorrect={q.multiCorrect}
                        disabled
                        variant={variant}
                      />
                    );
                  })}
                </div>

                {selected.length === 0 && (
                  <p className="mt-2 text-xs text-rose-500">Без ответа</p>
                )}

                {q.explanation && (
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
