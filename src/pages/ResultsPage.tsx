import { Link, Navigate, useParams } from "react-router-dom";
import { useAttempt } from "../hooks/useAttempts";
import AttemptReview from "../components/AttemptReview";
import Loader from "../components/Loader";
import { ArrowRightIcon, RefreshIcon } from "../components/icons";

export default function ResultsPage() {
  const { attemptId } = useParams();
  const { attempt, isLoading } = useAttempt(attemptId);

  if (isLoading) return <Loader label="Загружаем результаты…" />;
  if (!attempt) return <Navigate to="/" replace />;

  return (
    <AttemptReview
      attempt={attempt}
      actions={
        <>
          <Link to="/tests" className="btn-primary">
            <RefreshIcon className="h-4 w-4" />
            Новый тест
          </Link>
          <Link to="/" className="btn-secondary">
            На дашборд
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </>
      }
    />
  );
}
