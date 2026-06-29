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
import {
  TestsIcon,
  TrophyIcon,
  TargetIcon,
  CheckIcon,
  SparkIcon,
  TimerIcon,
  ArrowRightIcon,
  PlayIcon,
} from "../components/icons";

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
    <div className="space-y-10">
      {/* ── Герой ── */}
      <section
        className="stagger surface relative overflow-hidden p-7 sm:p-9"
        style={{ "--i": 0 } as React.CSSProperties}
      >
        <div className="relative max-w-2xl">
          <div className="chip-accent">Профиль М094 · ИКТ</div>
          <h1 className="mt-4 font-display text-3xl font-bold leading-[1.1] tracking-tight text-ink sm:text-4xl">
            Готовься к&nbsp;комплексному
            <br className="hidden sm:block" /> тестированию{" "}
            <span className="text-accent">осознанно.</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft sm:text-base">
            Алгоритмы и&nbsp;структуры данных, базы данных. Полный формат КТ —
            50&nbsp;вопросов за&nbsp;100&nbsp;минут с&nbsp;вердиктом по&nbsp;каждой
            дисциплине.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => startPreset(fullExam)}
              disabled={fullExamTotal === 0}
              className="btn-accent"
            >
              <PlayIcon className="h-4 w-4" />
              {fullExam.short} — начать экзамен
            </button>
            <Link to="/tests" className="btn-secondary">
              Все форматы и тренировка
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Метрики ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Всего попыток"
          value={`${stats.totalAttempts}`}
          icon={<TestsIcon className="h-5 w-5" />}
          tone="ink"
        />
        <StatCard
          label="Средний результат"
          value={`${stats.averagePercent}%`}
          icon={<TargetIcon className="h-5 w-5" />}
          tone="accent"
        />
        <StatCard
          label="Лучший результат"
          value={`${stats.bestPercent}%`}
          icon={<TrophyIcon className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label="Сдано экзаменов"
          value={`${stats.examsPassed}`}
          hint="порог по всем дисциплинам"
          icon={<CheckIcon className="h-5 w-5" />}
          tone="success"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* График динамики */}
        <section className="surface p-5 lg:col-span-3">
          <div className="mb-4 flex items-center gap-2">
            <SparkIcon className="h-4 w-4 text-accent" />
            <h2 className="font-display text-sm font-bold tracking-tight text-ink">
              Динамика результатов
            </h2>
          </div>
          <ScoreChart data={stats.timeline} />
        </section>

        {/* Результаты по дисциплинам */}
        <section className="surface p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-sm font-bold tracking-tight text-ink">
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
                    <span className="font-mono font-semibold text-ink">
                      {d.percent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-700"
                      style={{ width: `${d.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Последние попытки ── */}
      <section className="surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold tracking-tight text-ink">
            Последние попытки
          </h2>
          <Link
            to="/history"
            className="group inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            Вся история
            <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-faint">
              <TimerIcon className="h-6 w-6" />
            </div>
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
                  className="-mx-2 flex items-center justify-between rounded-lg px-2 py-3 transition hover:bg-surface-2"
                >
                  <div>
                    <div className="text-sm font-medium text-ink">
                      {a.mode === "exam"
                        ? (a.examTitle ?? "Экзамен")
                        : "Тренировка"}{" "}
                      <span className="font-mono text-ink-soft">
                        · {a.result.correct}/{a.result.total}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-ink-faint">
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
