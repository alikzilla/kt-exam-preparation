import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useBlocker, useLocation, useNavigate } from "react-router-dom";
import type { Attempt, GeneratedTest, TestMode } from "../types";
import { useTestSession } from "../hooks/useTestSession";
import { useCountdown } from "../hooks/useCountdown";
import { groupQuestions } from "../lib/groups";
import { gradeTest } from "../lib/grading";
import { useSaveAttempt } from "../hooks/useAttempts";
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
  const saveAttempt = useSaveAttempt();
  const { current } = session;
  const selected = session.answers[current.id] ?? [];
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Экзамен делится по дисциплинам — одна вкладка на дисциплину. Активная
  // вкладка определяется тем, в какую группу попал текущий вопрос.
  const groups = useMemo(() => groupQuestions(test), [test]);
  const grouped = groups.length > 1;
  const activeGroupIndex = Math.max(
    0,
    groups.findIndex((g) => g.items.some((it) => it.index === session.index))
  );
  const activeGroup = groups[activeGroupIndex];
  const positionInGroup =
    activeGroup.items.findIndex((it) => it.index === session.index) + 1;
  const answeredInGroup = (g: (typeof groups)[number]) =>
    g.items.filter((it) => (session.answers[it.question.id] ?? []).length > 0)
      .length;

  // Пока тест не завершён явно, уход со страницы блокируется: случайный
  // клик по ссылке не должен молча терять прогресс. Ref, а не state —
  // finish() ставит флаг синхронно перед navigate().
  const finishedRef = useRef(false);
  const blocker = useBlocker(() => !finishedRef.current);

  // Обновление/закрытие вкладки — нативный диалог браузера.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (finishedRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const finish = useCallback(() => {
    finishedRef.current = true;
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
    void saveAttempt(attempt).then(() => onSubmit(attempt));
  }, [test, mode, examTitle, passThreshold, session.answers, onSubmit, saveAttempt]);

  const remaining = useCountdown(durationSeconds, finish);

  const unanswered = session.total - session.answeredCount;
  const confirmMessage =
    unanswered > 0
      ? `Вы ответили на ${session.answeredCount} из ${session.total} вопросов. ${unanswered} останется без ответа.`
      : "Все вопросы отвечены. Завершить и посмотреть результат?";

  return (
    <div className="space-y-5">
      {/* Шапка сессии: прогресс + таймер, прилипает при прокрутке. */}
      <div className="sticky top-[57px] z-10 -mx-4 space-y-3 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-xs text-ink-faint">
            {mode === "exam" ? (examTitle ?? "Экзамен") : "Тренировка"}
            {grouped && (
              <span className="text-ink-soft">
                {" · "}
                {activeGroup.name}
              </span>
            )}
            <span className="tabular-nums text-ink">
              {" · "}
              {positionInGroup}
            </span>
            <span className="tabular-nums text-ink-faint">
              /{activeGroup.items.length}
            </span>
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs tabular-nums text-ink-soft sm:inline">
              отвечено {session.answeredCount}/{session.total}
            </span>
            {durationSeconds ? <Timer remaining={remaining} /> : null}
          </div>
        </div>
        <ProgressBar value={session.index + 1} max={session.total} />
      </div>

      {/* Вкладки дисциплин — показываем, когда групп больше одной. */}
      {grouped && (
        <div className="flex flex-wrap gap-2" role="tablist">
          {groups.map((g, gi) => {
            const isActive = gi === activeGroupIndex;
            const done = answeredInGroup(g);
            return (
              <button
                key={g.subjectId}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => session.goTo(g.startIndex)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line text-ink-soft hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {g.name}{" "}
                <span className="tabular-nums opacity-70">
                  ({done}/{g.items.length})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Навигатор по вопросам активной дисциплины */}
      <div>
        <div className="flex flex-wrap gap-1.5">
          {activeGroup.items.map(({ question: q, index: i }, local) => {
            const answered = (session.answers[q.id] ?? []).length > 0;
            const isCurrent = i === session.index;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => session.goTo(i)}
                aria-current={isCurrent}
                aria-label={`Вопрос ${local + 1}${answered ? ", отвечен" : ""}`}
                className={`h-8 w-8 rounded-lg text-xs font-medium tabular-nums transition-colors ${
                  isCurrent
                    ? "bg-accent text-white"
                    : answered
                      ? "bg-accent/10 text-accent hover:bg-accent/20"
                      : "bg-surface-2 text-ink-soft hover:bg-ink/10"
                }`}
              >
                {local + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Карточка вопроса */}
      <div key={current.id} className="surface p-6 sm:p-7">
        <div className="text-xs font-medium text-accent">
          {getSubjectName(current.subjectId)}
        </div>
        <h2 className="mt-2 text-lg font-semibold leading-snug text-ink">
          {current.text}
        </h2>
        {current.multiCorrect && (
          <p className="mt-1.5 inline-flex rounded-md bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
            Выберите все подходящие варианты
          </p>
        )}
        {current.imageUrl && (
          <img
            src={current.imageUrl}
            alt=""
            className="mt-4 max-h-64 rounded-lg border border-line"
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
            className="btn-primary"
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

      {/* Попытка уйти со страницы во время теста: прогресс не сохраняется. */}
      <ConfirmDialog
        open={blocker.state === "blocked"}
        title="Покинуть тестирование?"
        message="Прогресс не сохранится — ответы будут потеряны."
        confirmLabel="Покинуть"
        cancelLabel="Остаться"
        tone="danger"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </div>
  );
}
