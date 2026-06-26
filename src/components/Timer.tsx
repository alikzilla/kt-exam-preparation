import { formatTime } from "../hooks/useCountdown";

export default function Timer({ remaining }: { remaining: number }) {
  const low = remaining <= 5 * 60; // последние 5 минут
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold tabular-nums ${
        low
          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
      }`}
    >
      <span aria-hidden>⏱</span>
      <span>{formatTime(remaining)}</span>
    </div>
  );
}
