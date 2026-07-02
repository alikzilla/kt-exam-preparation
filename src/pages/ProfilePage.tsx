import { useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import StatCard from "../components/StatCard";

export default function ProfilePage() {
  const { userId } = useParams();
  const { user } = useUser();
  const profile = useQuery(
    api.profiles.publicProfile,
    userId ? { userId } : "skip"
  );
  const own = useQuery(api.profiles.my, user?.id === userId ? {} : "skip");
  const setPublic = useMutation(api.profiles.setPublic);
  const isOwn = user?.id === userId;

  if (profile === undefined) {
    return <div className="surface h-40 animate-pulse" />;
  }

  const shown = profile ?? (isOwn ? own : null);
  if (!shown) {
    return (
      <div className="surface p-10 text-center text-sm text-ink-soft">
        Профиль скрыт или не найден.
      </div>
    );
  }

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

      {isOwn && own && (
        <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-surface-2">
          <input
            type="checkbox"
            checked={!own.isPublic}
            onChange={(e) => void setPublic({ isPublic: !e.target.checked })}
            className="h-4 w-4 accent-[rgb(var(--c-accent))]"
          />
          Скрыть меня из лидерборда
        </label>
      )}
    </div>
  );
}
