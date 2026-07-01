export default function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="surface p-5">
      <div className="text-sm text-ink-soft">{label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-ink">
        {value}
      </div>
    </div>
  );
}
