import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { clearAttempts, loadAttempts } from "../lib/storage";
import ConfirmDialog from "./ConfirmDialog";
import { Spinner } from "./Loader";

const declineKey = (userId: string) => `kt-exam:migrate-declined:${userId}`;

/**
 * Разовое предложение перенести локальные попытки в аккаунт.
 * Показывается, если: вход выполнен, локально есть попытки,
 * в облаке пусто и пользователь ранее не отказывался.
 */
export default function MigrationPrompt() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const cloud = useQuery(api.attempts.myAttempts, isSignedIn ? {} : "skip");
  const importAttempts = useMutation(api.attempts.importAttempts);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isSignedIn || !user || dismissed) return null;
  if (cloud === undefined || cloud.length > 0) return null;

  const local = loadAttempts();
  if (local.length === 0) return null;
  if (localStorage.getItem(declineKey(user.id))) return null;

  const migrate = async () => {
    setBusy(true);
    try {
      const attempts = local.slice(0, 500).map(({ id, ...rest }) => ({
        localId: id,
        ...rest,
      }));
      await importAttempts({ attempts });
      clearAttempts();
    } finally {
      setBusy(false);
      setDismissed(true);
    }
  };

  const decline = () => {
    localStorage.setItem(declineKey(user.id), "1");
    setDismissed(true);
  };

  // Пока идёт перенос, показываем полноэкранный индикатор вместо диалога.
  if (busy) {
    return createPortal(
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      >
        <div className="surface flex items-center gap-3 px-6 py-4 shadow-modal">
          <Spinner className="h-5 w-5 text-accent" />
          <span className="text-sm text-ink-soft">Переносим попытки…</span>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <ConfirmDialog
      open={!busy}
      title="Перенести локальные попытки?"
      message={`У вас ${local.length} локальных попыток. Перенести их в аккаунт, чтобы история была доступна на всех устройствах?`}
      confirmLabel="Перенести"
      cancelLabel="Не переносить"
      onConfirm={migrate}
      onCancel={decline}
    />
  );
}
