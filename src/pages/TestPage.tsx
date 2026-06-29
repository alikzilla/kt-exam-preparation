import { useCallback, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import type { Attempt, GeneratedTest, TestMode } from "../types";
import { useTestSession } from "../hooks/useTestSession";
import { useCountdown } from "../hooks/useCountdown";
import { gradeTest } from "../lib/grading";
import { saveAttempt } from "../lib/storage";
import { getSubjectName } from "../data";
import OptionCard, { OPTION_LETTERS } from "../components/OptionCard";
import ProgressBar from "../components/ProgressBar";
import Timer from "../components/Timer";
import ConfirmDialog from "../components/ConfirmDialog";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "../components/icons";

interface TestState {
  test?: GeneratedTest;
  durationSeconds?: number;
  mode?: TestMode;
  examTitle?: string;
  passThreshold?: number;
}

export default function TestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as TestState | null;
  const test = state?.test;

  // Открыто без сгенерированного теста (прямой переход или перезагрузка).
  if (!test) return <Navigate to="/tests" replace />;

  return (
    <TestRunner
      test={test}
      mode={state?.mode ?? "practice"}
      durationSeconds={state?.durationSeconds}
      examTitle={state?.examTitle}
      passThreshold={state?.passThreshold}
      onSubmit={(a) => navigate(`/results/${a.id}`, { replace: true })}
    />
  );
}

function TestRunner({
  test,
  mode,
  durationSeconds,
  examTitle,
  passThreshold,
  onSubmit,
}: {
  test: GeneratedTest;
  mode: TestMode;
  durationSeconds?: number;
  examTitle?: string;
  passThreshold?: number;
  onSubmit: (attempt: Attempt) => void;
}) {
  const session = useTestSession(test);
  const { current } = session;
  const selected = session.answers[current.id] ?? [];
  const [confirmOpen, setConfirmOpen] = useState(false);

  const finish = useCallback(() => {
    const result = gradeTest(test, session.answers);
    const attempt: Attempt = {
      id: crypto.randomUUID(),
      takenAt: Date.now(),
      mode,
      examTitle,
      passThreshold,
      test,
      answers: session.answers,
      result,
    };
    saveAttempt(attempt);
    onSubmit(attempt);
  }, [test, mode, examTitle, passThreshold, session.answers, onSubmit]);

  const remaining = useCountdown(durationSeconds ?? 0, finish);

  const unanswered = session.total - session.answeredCount;
  const confirmMessage =
    unanswered > 0
      ? `Вы ответили на ${session.answeredCount} из ${session.total} вопросов. ${unanswered} останется без ответа.`
      : "Все вопросы отвечены. Завершить и посмотреть результат?";

  return (
    <div className="space-y-5">
      {/* Шапка сессии: прогресс + таймер, прилипает при прокрутке. */}
      <div className="sticky top-[57px] z-10 -mx-4 space-y-3 border-b border-line bg-paper/85 px-4 py-3 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-mono text-xs uppercase tracking-wider text-ink-faint">
            {mode === "exam" ? (examTitle ?? "Экзамен") : "Тренировка"}
            <span className="text-ink"> · {session.index + 1}</span>
            <span className="text-ink-faint">/{session.total}</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-xs text-ink-soft sm:inline">
              отвечено {session.answeredCount}/{session.total}
            </span>
            {durationSeconds ? <Timer remaining={remaining} /> : null}
          </div>
        </div>
        <ProgressBar value={session.index + 1} max={session.total} />
      </div>

      {/* Навигатор по вопросам */}
      <div>
        <div className="flex flex-wrap gap-1.5">
          {test.questions.map((q, i) => {
            const answered = (session.answers[q.id] ?? []).length > 0;
            const isCurrent = i === session.index;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => session.goTo(i)}
                aria-current={isCurrent}
                aria-label={`Вопрос ${i + 1}${answered ? ", отвечен" : ""}`}
                className={`h-8 w-8 rounded-lg font-mono text-xs font-medium transition ${
                  isCurrent
                    ? "bg-accent text-white shadow-accent"
                    : answered
                      ? "bg-accent/15 text-accent hover:bg-accent/25"
                      : "bg-surface-2 text-ink-soft hover:bg-line"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Карточка вопроса */}
      <div key={current.id} className="surface animate-fade-rise p-6 sm:p-7">
        <div className="eyebrow text-accent">
          {getSubjectName(current.subjectId)}
        </div>
        <h2 className="mt-2 text-lg font-semibold leading-snug text-ink">
          {current.text}
        </h2>
        {current.multiCorrect && (
          <p className="mt-1.5 inline-flex rounded-md bg-warning/12 px-2 py-0.5 text-xs font-medium text-warning">
            Выберите все подходящие варианты
          </p>
        )}
        {current.imageUrl && (
          <img
            src={current.imageUrl}
            alt=""
            className="mt-4 max-h-64 rounded-xl border border-line"
          />
        )}

        <div className="mt-5 space-y-2">
          {current.options.map((opt, i) => (
            <OptionCard
              key={opt.id}
              option={opt}
              letter={OPTION_LETTERS[i]}
              selected={selected.includes(opt.id)}
              multiCorrect={current.multiCorrect}
              onToggle={(id) =>
                session.select(current.id, id, current.multiCorrect)
              }
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={session.prev}
          disabled={session.isFirst}
          className="btn-secondary"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Назад
        </button>

        {session.isLast ? (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="btn-accent"
          >
            <CheckIcon className="h-4 w-4" />
            Завершить
          </button>
        ) : (
          <button type="button" onClick={session.next} className="btn-primary">
            Далее
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Завершить тестирование?"
        message={confirmMessage}
        confirmLabel="Завершить"
        cancelLabel="Продолжить"
        onConfirm={finish}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
