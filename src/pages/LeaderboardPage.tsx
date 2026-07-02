import { Link } from "react-router-dom";
import { useAuth, useUser, SignInButton } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Loader from "../components/Loader";

export default function LeaderboardPage() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const board = useQuery(api.profiles.leaderboard, {});
  const myRank = useQuery(api.profiles.myRank, isSignedIn ? {} : "skip");

  if (board === undefined) {
    return <Loader label="Загружаем лидерборд…" />;
  }

  const inTop = user && board.some((e) => e.userId === user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Лидерборд
      </h1>

      {!isSignedIn && (
        <p className="text-sm text-ink-soft">
          Лучшие результаты экзаменов.{" "}
          <SignInButton mode="modal">
            <button type="button" className="font-medium text-accent hover:underline">
              Войдите
            </button>
          </SignInButton>{" "}
          — и ваш результат появится здесь.
        </p>
      )}

      {board.length === 0 ? (
        <div className="surface p-10 text-center text-sm text-ink-soft">
          Пока никто не сдал экзамен. Будьте первым!
        </div>
      ) : (
        <ul className="surface divide-y divide-line">
          {board.map((e, i) => {
            const isMe = user?.id === e.userId;
            return (
              <li key={e.userId}>
                <Link
                  to={`/u/${e.userId}`}
                  className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-2 ${
                    isMe ? "bg-accent/5" : ""
                  }`}
                >
                  <span className="w-8 text-sm font-semibold tabular-nums text-ink-faint">
                    {i + 1}
                  </span>
                  {e.avatarUrl ? (
                    <img
                      src={e.avatarUrl}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink-soft">
                      {e.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="flex-1 truncate text-sm font-medium text-ink">
                    {e.name}
                    {isMe && <span className="text-ink-faint"> · вы</span>}
                  </span>
                  <span className="text-xs tabular-nums text-ink-faint">
                    {e.examAttempts} экз.
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-ink">
                    {e.bestExamPercent}%
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {isSignedIn && myRank && !inTop && (
        <p className="text-sm text-ink-soft">
          Ваше место: <span className="font-semibold tabular-nums text-ink">{myRank.rank}</span>
        </p>
      )}
    </div>
  );
}
