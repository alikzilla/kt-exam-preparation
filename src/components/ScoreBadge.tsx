export default function ScoreBadge({ percent }: { percent: number }) {
  const tone =
    percent >= 70
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
      : percent >= 50
        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
        : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${tone}`}
    >
      {percent}%
    </span>
  );
}
