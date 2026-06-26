import { useState } from "react";
import { Link } from "react-router-dom";
import { clearAttempts, loadAttempts } from "../lib/storage";
import { scorePercent } from "../lib/grading";
import { getSubjectName } from "../data";
import ScoreBadge from "../components/ScoreBadge";

const surface =
  "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

export default function HistoryPage() {
  const [attempts, setAttempts] = useState(() => loadAttempts());

  const clear = () => {
    if (!window.confirm("Очистить всю историю попыток?")) return;
    clearAttempts();
    setAttempts([]);
  };

  if (attempts.length === 0) {
    return (
      <div className={`${surface} flex flex-col items-center gap-3 p-10 text-center`}>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Пока нет попыток
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Пройдите тест, и результаты появятся здесь.
        </p>
        <Link
          to="/tests"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-700"
        >
          Перейти к тестам
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          Все попытки ({attempts.length})
        </h1>
        <button
          type="button"
          onClick={clear}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-rose-500/10"
        >
          Очистить историю
        </button>
      </div>

      <div className="space-y-3">
        {attempts.map((a) => (
          <Link
            key={a.id}
            to={`/results/${a.id}`}
            className={`${surface} flex items-center justify-between p-4 transition hover:border-indigo-300 hover:shadow-sm dark:hover:border-indigo-500/40`}
          >
            <div>
              <div className="font-medium text-slate-900 dark:text-white">
                {a.mode === "exam" ? (a.examTitle ?? "Экзамен") : "Тренировка"} ·{" "}
                {a.result.correct}/{a.result.total} верно
              </div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {new Date(a.takenAt).toLocaleString("ru-RU")} ·{" "}
                {a.test.subjectIds.map(getSubjectName).join(", ")}
              </div>
            </div>
            <ScoreBadge percent={scorePercent(a.result)} />
          </Link>
        ))}
      </div>
    </div>
  );
}
