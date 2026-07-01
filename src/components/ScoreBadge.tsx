export default function ScoreBadge({ percent }: { percent: number }) {
  const tone =
    percent >= 70
      ? "bg-success/10 text-success ring-success/20"
      : percent >= 50
        ? "bg-warning/10 text-warning ring-warning/20"
        : "bg-danger/10 text-danger ring-danger/20";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold tabular-nums ring-1 ring-inset ${tone}`}
    >
      {percent}%
    </span>
  );
}
