export function Spinner({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-20"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Загрузка данных страницы: спиннер по центру карточки. */
export default function Loader({ label = "Загрузка…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="surface flex flex-col items-center justify-center gap-3 p-12"
    >
      <Spinner className="h-6 w-6 text-accent" />
      <span className="text-sm text-ink-soft">{label}</span>
    </div>
  );
}
