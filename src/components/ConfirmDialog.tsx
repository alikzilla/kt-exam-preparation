import { useEffect, useRef } from "react";
import { AlertIcon } from "./icons";

/**
 * Доступное модальное подтверждение взамен window.confirm.
 * Закрывается по Esc и клику вне окна, возвращает фокус понятным образом,
 * блокирует прокрутку фона на время показа.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Подтвердить",
  cancelLabel = "Отмена",
  tone = "accent",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "accent" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Фокус на основной кнопке для управления с клавиатуры.
    confirmRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClass =
    tone === "danger"
      ? "btn-primary !bg-danger hover:!bg-danger/90"
      : "btn-primary";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="absolute inset-0 bg-ink/40" onClick={onCancel} />
      <div className="surface relative w-full max-w-md p-6 shadow-modal">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
              tone === "danger"
                ? "bg-danger/10 text-danger"
                : "bg-accent/10 text-accent"
            }`}
          >
            <AlertIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2
              id="confirm-title"
              className="text-lg font-semibold tracking-tight text-ink"
            >
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {message}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary">
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={confirmClass}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
