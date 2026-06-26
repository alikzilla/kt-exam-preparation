import { useMemo } from "react";
import { Link } from "react-router-dom";
import { loadAttempts } from "../lib/storage";
import { computeStats } from "../lib/stats";
import { scorePercent } from "../lib/grading";
import { getQuestionsBySubject, getSubjectName } from "../data";
import { EXAM_PRESETS, presetTotal } from "../data/exam";
import { useStartTest } from "../hooks/useStartTest";
import StatCard from "../components/StatCard";
import ScoreChart from "../components/ScoreChart";
import ScoreBadge from "../components/ScoreBadge";
import {
  TestsIcon,
  TrophyIcon,
  TargetIcon,
  CheckIcon,
  SparkIcon,
  TimerIcon,
} from "../components/icons";

const surface =
  "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

export default function DashboardPage() {
  const { startPreset } = useStartTest();
  const attempts = useMemo(() => loadAttempts(), []);
  const stats = useMemo(() => computeStats(attempts), [attempts]);
  const recent = attempts.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Пресеты экзаменов */}
      <section className="grid gap-4 md:grid-cols-3">
        {EXAM_PRESETS.map((preset) => {
          const total = preset.disciplines.reduce(
            (s, d) =>
              s + Math.min(d.count, getQuestionsBySubject(d.subjectId).length),
            0
          );
          return (
            <div
              key={preset.id}
              className={`${surface} flex flex-col p-5`}
            >
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  {preset.short}
                </span>
                <span className="text-xs text-slate-400">
                  {presetTotal(preset)} вопросов · {preset.durationMinutes} мин
                </span>
              </div>
              <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">
                {preset.title}
              </h3>
              <p className="mt-1 flex-1 text-sm text-slate-500 dark:text-slate-400">
                {preset.description}
              </p>
              <button
                type="button"
                onClick={() => startPreset(preset)}
                disabled={total === 0}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:bg-slate-300"
              >
                Начать
              </button>
            </div>
          );
        })}
      </section>

      {/* Метрики */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Всего попыток"
          value={`${stats.totalAttempts}`}
          icon={<TestsIcon className="h-5 w-5" />}
          tone="indigo"
        />
        <StatCard
          label="Средний результат"
          value={`${stats.averagePercent}%`}
          icon={<TargetIcon className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label="Лучший результат"
          value={`${stats.bestPercent}%`}
          icon={<TrophyIcon className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Сдано экзаменов"
          value={`${stats.examsPassed}`}
          hint="порог по всем дисциплинам"
          icon={<CheckIcon className="h-5 w-5" />}
          tone="emerald"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* График динамики */}
        <section className={`${surface} p-5 lg:col-span-3`}>
          <div className="mb-2 flex items-center gap-2">
            <SparkIcon className="h-5 w-5 text-indigo-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Динамика результатов
            </h2>
          </div>
          <ScoreChart data={stats.timeline} />
        </section>

        {/* Результаты по дисциплинам */}
        <section className={`${surface} p-5 lg:col-span-2`}>
          <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">
            По дисциплинам
          </h2>
          {stats.perDiscipline.length === 0 ? (
            <p className="text-sm text-slate-400">Пока нет данных.</p>
          ) : (
            <div className="space-y-3">
              {stats.perDiscipline.map((d) => (
                <div key={d.subjectId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">
                      {getSubjectName(d.subjectId)}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {d.percent}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-indigo-500"
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
      <section className={`${surface} p-5`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Последние попытки
          </h2>
          <Link
            to="/history"
            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Вся история
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <TimerIcon className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">
              Здесь появятся ваши результаты после первого теста.
            </p>
            <Link
              to="/tests"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Перейти к тестам
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recent.map((a) => (
              <Link
                key={a.id}
                to={`/results/${a.id}`}
                className="flex items-center justify-between py-3 transition hover:opacity-80"
              >
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {a.mode === "exam"
                      ? (a.examTitle ?? "Экзамен")
                      : "Тренировка"}{" "}
                    · {a.result.correct}/{a.result.total}
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(a.takenAt).toLocaleString("ru-RU")}
                  </div>
                </div>
                <ScoreBadge percent={scorePercent(a.result)} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
