import { Link, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { scorePercent } from "../lib/grading";
import { subjectPoints } from "../lib/stats";
import { getSubjectName } from "../data";
import StatCard from "../components/StatCard";
import ScoreBadge from "../components/ScoreBadge";
import ScoreChart from "../components/ScoreChart";
import Loader from "../components/Loader";

export default function ProfilePage() {
  const { userId } = useParams();
  const { user } = useUser();
  const isOwn = user?.id === userId;
  const profile = useQuery(
    api.profiles.publicProfile,
    userId ? { userId } : "skip"
  );
  const own = useQuery(api.profiles.my, isOwn ? {} : "skip");
  const exams = useQuery(
    api.attempts.publicExamAttempts,
    userId ? { userId } : "skip"
  );
  const setPublic = useMutation(api.profiles.setPublic);
  const setExamsPublic = useMutation(api.profiles.setExamsPublic);

  if (profile === undefined) {
    return <Loader label="Загружаем профиль…" />;
  }

  const shown = profile ?? (isOwn ? own : null);
  if (!shown) {
    return (
      <div className="surface p-10 text-center text-sm text-ink-soft">
        Профиль скрыт или не найден.
      </div>
    );
  }

  // Экзамены скрыты для посторонних, если владелец выключил examsPublic.
  const examsHidden = !isOwn && profile !== null && !profile.examsVisible;
  const examList = exams ?? [];
  const chartData = examList
    .slice()
    .reverse()
    .map((a) => ({ takenAt: a.takenAt, percent: scorePercent(a.result) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {shown.avatarUrl ? (
          <img src={shown.avatarUrl} alt="" className="h-14 w-14 rounded-full" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-lg font-semibold text-ink-soft">
            {shown.name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {shown.name}
        </h1>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Лучший экзамен" value={`${shown.bestExamPercent}%`} />
        <StatCard label="Экзаменов сдано" value={`${shown.examAttempts}`} />
        <StatCard label="Дней подряд" value={`${shown.streakDays}`} />
      </section>

      {examsHidden ? (
        <div className="surface p-8 text-center text-sm text-ink-soft">
          Результаты экзаменов скрыты.
        </div>
      ) : (
        <>
          {chartData.length > 0 && (
            <section className="surface p-5">
              <h2 className="mb-3 text-sm font-semibold text-ink">
                Динамика экзаменов
              </h2>
              <ScoreChart data={chartData} />
            </section>
          )}

          {examList.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-ink">
                Экзамены{" "}
                <span className="tabular-nums text-ink-faint">
                  ({examList.length})
                </span>
              </h2>
              <ul className="space-y-3">
                {examList.map((a) => (
                  <li key={a.localId}>
                    <Link
                      to={`/u/${userId}/results/${a.localId}`}
                      className="surface-interactive flex items-center justify-between gap-3 p-4"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">
                          {a.examTitle ?? "Экзамен"}{" "}
                          <span className="tabular-nums text-ink-soft">
                            · {a.result.correct}/{a.result.total}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-xs tabular-nums text-ink-faint">
                          {new Date(a.takenAt).toLocaleString("ru-RU")} ·{" "}
                          {a.result.perSubject
                            .map(
                              (s) =>
                                `${getSubjectName(s.subjectId)} ${subjectPoints(s)}/${s.maxPoints ?? s.total}`
                            )
                            .join(", ")}
                        </div>
                      </div>
                      <ScoreBadge percent={scorePercent(a.result)} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {isOwn && own && (
        <div className="flex flex-wrap gap-3">
          <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-surface-2">
            <input
              type="checkbox"
              checked={!own.isPublic}
              onChange={(e) => void setPublic({ isPublic: !e.target.checked })}
              className="h-4 w-4 accent-[rgb(var(--c-accent))]"
            />
            Скрыть меня из лидерборда
          </label>
          <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-surface-2">
            <input
              type="checkbox"
              checked={!(own.examsPublic ?? true)}
              onChange={(e) =>
                void setExamsPublic({ examsPublic: !e.target.checked })
              }
              className="h-4 w-4 accent-[rgb(var(--c-accent))]"
            />
            Скрыть мои результаты экзаменов
          </label>
        </div>
      )}
    </div>
  );
}
