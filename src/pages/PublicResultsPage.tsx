import { Link, useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Attempt } from "../types";
import AttemptReview from "../components/AttemptReview";
import Loader from "../components/Loader";
import { ArrowLeftIcon } from "../components/icons";

export default function PublicResultsPage() {
  const { userId, localId } = useParams();
  const doc = useQuery(
    api.attempts.publicAttempt,
    localId ? { localId } : "skip"
  );
  const profile = useQuery(
    api.profiles.publicProfile,
    userId ? { userId } : "skip"
  );

  if (doc === undefined) return <Loader label="Загружаем результаты…" />;
  if (!doc || doc.userId !== userId) {
    return (
      <div className="surface p-10 text-center text-sm text-ink-soft">
        Результат скрыт или не найден.
      </div>
    );
  }

  const { _id, _creationTime, userId: owner, localId: lid, ...rest } = doc;
  const attempt: Attempt = { id: lid, ...rest };

  return (
    <div className="space-y-6">
      <Link
        to={`/u/${userId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {profile ? `Профиль: ${profile.name}` : "К профилю"}
      </Link>
      <AttemptReview
        attempt={attempt}
        actions={
          <Link to={`/u/${userId}`} className="btn-secondary">
            К профилю
          </Link>
        }
      />
    </div>
  );
}
