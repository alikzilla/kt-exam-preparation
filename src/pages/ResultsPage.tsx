import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { DEFAULT_PASS_THRESHOLD } from "../types";
import { getAttempt } from "../lib/storage";
import { scorePercent } from "../lib/grading";
import { getSubjectName } from "../data";
import ScoreBadge from "../components/ScoreBadge";
import OptionCard, { OPTION_LETTERS } from "../components/OptionCard";
import {
  CheckIcon,
  CloseIcon,
  ArrowRightIcon,
  RefreshIcon,
} from "../components/icons";

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
      {/* ── Сводка ── */}
      <div className="surface relative overflow-hidden p-6 sm:p-7">
        <div
          className={`pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full blur-3xl ${
            isExam
              ? passedExam
                ? "bg-success/15"
                : "bg-danger/15"
              : "bg-accent/12"
          }`}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">{isExam ? "Экзамен" : "Тренировка"}</div>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
              {isExam ? (attempt.examTitle ?? "Экзамен") : "Свободный режим"}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Правильных{" "}
              <span className="font-mono font-semibold text-ink">
                {result.correct}
              </span>{" "}
              из{" "}
              <span className="font-mono text-ink-soft">{result.total}</span>
            </p>
          </div>
          <ScoreBadge percent={percent} />
        </div>

        {isExam && (
          <div
            className={`relative mt-5 flex items-center gap-3 rounded-xl px-4 py-3.5 ${
              passedExam
                ? "bg-success/12 text-success"
                : "bg-danger/12 text-danger"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                passedExam ? "bg-success/20" : "bg-danger/20"
              }`}
            >
              {passedExam ? (
                <CheckIcon className="h-4 w-4" strokeWidth={2.6} />
              ) : (
                <CloseIcon className="h-4 w-4" strokeWidth={2.6} />
              )}
            </div>
            <span className="text-sm font-semibold">
              {passedExam
                ? "Сдал — порог пройден по всем дисциплинам"
                : `Не сдал — нужно не менее ${threshold} баллов по каждой дисциплине`}
            </span>
          </div>
        )}

        <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
          {result.perSubject.map((s) => {
            const passed = disciplinePassed(s.correct);
            return (
              <div key={s.subjectId} className="surface-2 p-4">
                <div className="text-xs font-medium text-ink-soft">
                  {getSubjectName(s.subjectId)}
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="font-mono text-xl font-semibold text-ink">
                    {s.correct}
                    <span className="text-ink-faint">/{s.total}</span>
                  </span>
                  {isExam && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        passed
                          ? "bg-success/12 text-success"
                          : "bg-danger/12 text-danger"
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

        <div className="relative mt-6 flex flex-wrap gap-3">
          <Link to="/tests" className="btn-accent">
            <RefreshIcon className="h-4 w-4" />
            Новый тест
          </Link>
          <Link to="/" className="btn-secondary">
            На дашборд
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ── Разбор ответов ── */}
      <div>
        <div className="mb-4">
          <div className="eyebrow">Разбор</div>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-ink">
            Ответы по вопросам
          </h2>
        </div>
        <div className="space-y-4">
          {test.questions.map((q, i) => {
            const r = resultById.get(q.id);
            const selected = r?.selectedOptionIds ?? [];
            const correctSet = new Set(q.correctOptionIds);
            return (
              <div key={q.id} className="surface p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="font-semibold leading-snug text-ink">
                    <span className="font-mono text-ink-faint">{i + 1}.</span>{" "}
                    {q.text}
                  </h3>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      r?.correct
                        ? "bg-success/12 text-success"
                        : "bg-danger/12 text-danger"
                    }`}
                  >
                    {r?.correct ? (
                      <CheckIcon className="h-3 w-3" strokeWidth={2.8} />
                    ) : (
                      <CloseIcon className="h-3 w-3" strokeWidth={2.8} />
                    )}
                    {r?.correct ? "Верно" : "Неверно"}
                  </span>
                </div>
                <div className="font-mono text-xs uppercase tracking-wider text-ink-faint">
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
                  <p className="mt-2 text-xs font-medium text-danger">
                    Без ответа
                  </p>
                )}

                {q.explanation && (
                  <p className="mt-3 rounded-xl border-l-2 border-accent bg-surface-2 p-3 text-sm leading-relaxed text-ink-soft">
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
