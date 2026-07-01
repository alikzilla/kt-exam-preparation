import { formatTime } from "../hooks/useCountdown";
import { TimerIcon } from "./icons";

export default function Timer({ remaining }: { remaining: number }) {
  const low = remaining <= 5 * 60; // последние 5 минут
  return (
    <div
      role="timer"
      aria-live={low ? "assertive" : "off"}
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold tabular-nums ring-1 ring-inset transition ${
        low
          ? "animate-pulse-ring bg-danger/10 text-danger ring-danger/25"
          : "bg-surface-2 text-ink ring-line"
      }`}
    >
      <TimerIcon className="h-4 w-4" />
      <span>{formatTime(remaining)}</span>
    </div>
  );
}
