import { useMemo } from "react";
import { Link } from "react-router-dom";
import { loadAttempts } from "../lib/storage";
import { computeStats } from "../lib/stats";
import { scorePercent } from "../lib/grading";
import { getQuestionsBySubject, getSubjectName } from "../data";
import { EXAM_PRESETS } from "../data/exam";
import { useStartTest } from "../hooks/useStartTest";
import StatCard from "../components/StatCard";
import ScoreChart from "../components/ScoreChart";
import ScoreBadge from "../components/ScoreBadge";

export default function DashboardPage() {
  const { startPreset } = useStartTest();
  const attempts = useMemo(() => loadAttempts(), []);
  const stats = useMemo(() => computeStats(attempts), [attempts]);
  const recent = attempts.slice(0, 5);

  const fullExam = EXAM_PRESETS[0];
  const fullExamTotal = useMemo(
    () =>
      fullExam.disciplines.reduce(
        (s, d) =>
          s + Math.min(d.count, getQuestionsBySubject(d.subjectId).length),
        0
      ),
    [fullExam]
  );

  return (
    <div className="space-y-6">
      {/* Заголовок + главное действие */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Дашборд
        </h1>
        <button
          type="button"
          onClick={() => startPreset(fullExam)}
          disabled={fullExamTotal === 0}
          className="btn-primary"
        >
          Начать экзамен
        </button>
      </div>

      {/* Метрики */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Всего попыток" value={`${stats.totalAttempts}`} />
        <StatCard label="Средний результат" value={`${stats.averagePercent}%`} />
        <StatCard label="Лучший результат" value={`${stats.bestPercent}%`} />
        <StatCard label="Сдано экзаменов" value={`${stats.examsPassed}`} />
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* График динамики */}
        <section className="surface p-5 lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-ink">
            Динамика результатов
          </h2>
          <ScoreChart data={stats.timeline} />
        </section>

        {/* Результаты по дисциплинам */}
        <section className="surface p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-ink">
            По дисциплинам
          </h2>
          {stats.perDiscipline.length === 0 ? (
            <p className="text-sm text-ink-faint">Пока нет данных.</p>
          ) : (
            <div className="space-y-4">
              {stats.perDiscipline.map((d) => (
                <div key={d.subjectId}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-ink-soft">
                      {getSubjectName(d.subjectId)}
                    </span>
                    <span className="font-semibold tabular-nums text-ink">
                      {d.percent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-300"
                      style={{ width: `${d.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Последние попытки */}
      <section className="surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Последние попытки</h2>
          <Link
            to="/history"
            className="text-sm font-medium text-accent hover:underline"
          >
            Вся история
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-ink-soft">
              Здесь появятся ваши результаты после первого теста.
            </p>
            <Link to="/tests" className="btn-primary">
              Перейти к тестам
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((a) => (
              <li key={a.id}>
                <Link
                  to={`/results/${a.id}`}
                  className="-mx-2 flex items-center justify-between rounded-lg px-2 py-3 transition-colors hover:bg-surface-2"
                >
                  <div>
                    <div className="text-sm font-medium text-ink">
                      {a.mode === "exam"
                        ? (a.examTitle ?? "Экзамен")
                        : "Тренировка"}{" "}
                      <span className="tabular-nums text-ink-soft">
                        · {a.result.correct}/{a.result.total}
                      </span>
                    </div>
                    <div className="text-xs tabular-nums text-ink-faint">
                      {new Date(a.takenAt).toLocaleString("ru-RU")}
                    </div>
                  </div>
                  <ScoreBadge percent={scorePercent(a.result)} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
