export default function ScoreBadge({ percent }: { percent: number }) {
  const tone =
    percent >= 70
      ? "bg-success/12 text-success ring-success/20"
      : percent >= 50
        ? "bg-warning/15 text-warning ring-warning/25"
        : "bg-danger/12 text-danger ring-danger/20";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-sm font-semibold tabular-nums ring-1 ring-inset ${tone}`}
    >
      {percent}%
    </span>
  );
}
