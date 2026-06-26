import { useCallback } from "react";
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

interface TestState {
  test?: GeneratedTest;
  durationSeconds?: number;
  mode?: TestMode;
  examTitle?: string;
  passThreshold?: number;
}

const surface =
  "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

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

  const submit = () => {
    const unanswered = session.total - session.answeredCount;
    const msg =
      unanswered > 0
        ? `Вы ответили на ${session.answeredCount} из ${session.total}. Завершить тестирование?`
        : "Завершить тестирование?";
    if (window.confirm(msg)) finish();
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>
            {mode === "exam" ? (examTitle ?? "Экзамен") : "Тренировка"} · вопрос{" "}
            {session.index + 1} из {session.total}
          </span>
          <div className="flex items-center gap-3">
            <span>Отвечено: {session.answeredCount}</span>
            {durationSeconds ? <Timer remaining={remaining} /> : null}
          </div>
        </div>
        <ProgressBar value={session.index + 1} max={session.total} />
      </div>

      {/* Навигатор по вопросам */}
      <div className="flex flex-wrap gap-1.5">
        {test.questions.map((q, i) => {
          const answered = (session.answers[q.id] ?? []).length > 0;
          const isCurrent = i === session.index;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => session.goTo(i)}
              className={`h-7 w-7 rounded text-xs font-medium transition ${
                isCurrent
                  ? "bg-indigo-600 text-white"
                  : answered
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className={`${surface} p-6`}>
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          {getSubjectName(current.subjectId)}
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {current.text}
        </h2>
        {current.multiCorrect && (
          <p className="mt-1 text-xs text-slate-400">
            Выберите все подходящие варианты.
          </p>
        )}
        {current.imageUrl && (
          <img
            src={current.imageUrl}
            alt=""
            className="mt-4 max-h-64 rounded-lg border border-slate-200 dark:border-slate-700"
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
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Назад
        </button>

        {session.isLast ? (
          <button
            type="button"
            onClick={submit}
            className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white transition hover:bg-emerald-700"
          >
            Завершить
          </button>
        ) : (
          <button
            type="button"
            onClick={session.next}
            className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white transition hover:bg-indigo-700"
          >
            Далее
          </button>
        )}
      </div>
    </div>
  );
}
