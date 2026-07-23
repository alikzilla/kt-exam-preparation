import type { ReactNode } from "react";
import { DEFAULT_PASS_THRESHOLD, type Attempt } from "../types";
import { scorePercent } from "../lib/grading";
import { subjectPoints } from "../lib/stats";
import { getSubjectName } from "../data";
import ScoreBadge from "./ScoreBadge";
import OptionCard, { OPTION_LETTERS } from "./OptionCard";
import PassageCard from "./PassageCard";
import QuestionText from "./QuestionText";
import { CheckIcon, CloseIcon } from "./icons";

/** Разбор попытки: сводка + ответы по вопросам. Используется на странице
 * собственных результатов и в публичном профиле. */
export default function AttemptReview({
  attempt,
  actions,
}: {
  attempt: Attempt;
  actions?: ReactNode;
}) {
  const { test, result, mode } = attempt;
  const percent = scorePercent(result);
  const threshold = attempt.passThreshold ?? DEFAULT_PASS_THRESHOLD;
  const resultById = new Map(result.perQuestion.map((r) => [r.questionId, r]));

  const isExam = mode === "exam";
  const disciplinePassed = (points: number) => points >= threshold;
  const passedExam =
    isExam && result.perSubject.every((s) => disciplinePassed(subjectPoints(s)));

  return (
    <div className="space-y-6">
      {/* ── Сводка ── */}
      <div className="surface p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-ink-faint">
              {isExam ? "Экзамен" : "Тренировка"}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              {isExam ? (attempt.examTitle ?? "Экзамен") : "Свободный режим"}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Правильных{" "}
              <span className="font-semibold tabular-nums text-ink">
                {result.correct}
              </span>{" "}
              из{" "}
              <span className="tabular-nums text-ink-soft">{result.total}</span>
            </p>
            {(result.maxPoints ?? 0) > 0 && (
              <p className="mt-0.5 text-sm text-ink-soft">
                Баллов{" "}
                <span className="font-semibold tabular-nums text-ink">
                  {result.points}
                </span>{" "}
                из{" "}
                <span className="tabular-nums text-ink-soft">
                  {result.maxPoints}
                </span>
              </p>
            )}
          </div>
          <ScoreBadge percent={percent} />
        </div>

        {isExam && (
          <div
            className={`mt-5 flex items-center gap-3 rounded-lg px-4 py-3.5 ${
              passedExam
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
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

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {result.perSubject.map((s) => {
            const points = subjectPoints(s);
            const maxPoints = s.maxPoints ?? s.total;
            const passed = disciplinePassed(points);
            return (
              <div key={s.subjectId} className="surface-2 p-4">
                <div className="text-xs font-medium text-ink-soft">
                  {getSubjectName(s.subjectId)}
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-xl tabular-nums font-semibold text-ink">
                    {points}
                    <span className="text-ink-faint">/{maxPoints}</span>
                    <span className="ml-1 text-xs font-normal text-ink-faint">
                      балл · верно {s.correct}/{s.total}
                    </span>
                  </span>
                  {isExam && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        passed
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
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

        {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
      </div>

      {/* ── Разбор ответов ── */}
      <div>
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">
          Ответы по вопросам
        </h2>
        <div className="space-y-4">
          {test.questions.map((q, i) => {
            const r = resultById.get(q.id);
            const selected = r?.selectedOptionIds ?? [];
            const correctSet = new Set(q.correctOptionIds);
            // Частичный зачёт (для профильной дисциплины): 0 < earned < maxPoints.
            const partial =
              r?.pointsEarned !== undefined &&
              r?.maxPoints !== undefined &&
              r.pointsEarned > 0 &&
              r.pointsEarned < r.maxPoints;
            return (
              <div key={q.id} className="surface p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="font-semibold leading-snug text-ink">
                    <span className="tabular-nums text-ink-faint">{i + 1}.</span>{" "}
                    <QuestionText text={q.text} />
                  </h3>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      r?.correct
                        ? "bg-success/10 text-success"
                        : partial
                          ? "bg-accent/10 text-accent"
                          : "bg-danger/10 text-danger"
                    }`}
                  >
                    {r?.correct ? (
                      <CheckIcon className="h-3 w-3" strokeWidth={2.8} />
                    ) : (
                      <CloseIcon className="h-3 w-3" strokeWidth={2.8} />
                    )}
                    {r?.correct
                      ? "Верно"
                      : partial
                        ? `Частично · ${r!.pointsEarned}/${r!.maxPoints}`
                        : "Неверно"}
                  </span>
                </div>
                <div className="text-xs text-ink-faint">
                  {getSubjectName(q.subjectId)}
                </div>

                {q.passageId && (
                  <div className="mt-3">
                    <PassageCard passageId={q.passageId} />
                  </div>
                )}
                {q.imageUrl && (
                  <img
                    src={q.imageUrl}
                    alt=""
                    className="mt-3 max-h-72 rounded-lg border border-line bg-white p-2"
                  />
                )}

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
                  <p className="mt-3 rounded-lg border-l-2 border-accent bg-surface-2 p-3 text-sm leading-relaxed text-ink-soft">
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
