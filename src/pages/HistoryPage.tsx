import { useState } from "react";
import { Link } from "react-router-dom";
import { clearAttempts, loadAttempts } from "../lib/storage";
import { scorePercent } from "../lib/grading";
import { getSubjectName } from "../data";
import ScoreBadge from "../components/ScoreBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import { HistoryIcon, TrashIcon, ArrowRightIcon } from "../components/icons";

export default function HistoryPage() {
  const [attempts, setAttempts] = useState(() => loadAttempts());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const clear = () => {
    clearAttempts();
    setAttempts([]);
    setConfirmOpen(false);
  };

  if (attempts.length === 0) {
    return (
      <div className="surface flex flex-col items-center gap-4 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-ink-faint">
          <HistoryIcon className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink">
            Пока нет попыток
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Пройдите тест, и результаты появятся здесь.
          </p>
        </div>
        <Link to="/tests" className="btn-primary">
          Перейти к тестам
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="eyebrow">Журнал</div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
            Все попытки{" "}
            <span className="font-mono text-ink-faint">({attempts.length})</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="btn-ghost btn-sm hover:bg-danger/10 hover:text-danger"
        >
          <TrashIcon className="h-4 w-4" />
          Очистить
        </button>
      </div>

      <ul className="space-y-3">
        {attempts.map((a) => (
          <li key={a.id}>
            <Link
              to={`/results/${a.id}`}
              className="surface-interactive flex items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-ink">
                  {a.mode === "exam"
                    ? (a.examTitle ?? "Экзамен")
                    : "Тренировка"}{" "}
                  <span className="font-mono text-ink-soft">
                    · {a.result.correct}/{a.result.total}
                  </span>
                </div>
                <div className="mt-0.5 truncate font-mono text-xs text-ink-faint">
                  {new Date(a.takenAt).toLocaleString("ru-RU")} ·{" "}
                  {a.test.subjectIds.map(getSubjectName).join(", ")}
                </div>
              </div>
              <ScoreBadge percent={scorePercent(a.result)} />
            </Link>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={confirmOpen}
        title="Очистить историю?"
        message="Все сохранённые попытки будут удалены без возможности восстановления."
        confirmLabel="Очистить"
        cancelLabel="Отмена"
        tone="danger"
        onConfirm={clear}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
