interface Point {
  takenAt: number;
  percent: number;
}

/**
 * Лёгкий линейный график динамики результатов без внешних зависимостей.
 * Рисуется в системе координат 0..100% по вертикали.
 */
export default function ScoreChart({ data }: { data: Point[] }) {
  const W = 600;
  const H = 180;
  const padX = 14;
  const padY = 18;

  if (data.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-ink-faint">
        Пока нет данных — пройдите тест.
      </div>
    );
  }

  const n = data.length;
  const x = (i: number) =>
    n === 1 ? W / 2 : padX + (i * (W - 2 * padX)) / (n - 1);
  const y = (p: number) => padY + ((100 - p) * (H - 2 * padY)) / 100;

  const linePath = data
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.percent).toFixed(1)}`
    )
    .join(" ");
  const areaPath =
    `M ${x(0).toFixed(1)} ${(H - padY).toFixed(1)} ` +
    data
      .map((d, i) => `L ${x(i).toFixed(1)} ${y(d.percent).toFixed(1)}`)
      .join(" ") +
    ` L ${x(n - 1).toFixed(1)} ${(H - padY).toFixed(1)} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-44 w-full text-accent"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Сетка: 0/50/100% */}
      {[0, 50, 100].map((p) => (
        <line
          key={p}
          x1={padX}
          x2={W - padX}
          y1={y(p)}
          y2={y(p)}
          className="stroke-line"
          strokeWidth="1"
          strokeDasharray={p === 50 ? "4 5" : undefined}
        />
      ))}

      <path d={areaPath} fill="url(#scoreFill)" />
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(d.percent)}
          r="4"
          className="fill-surface"
          stroke="currentColor"
          strokeWidth="2.5"
        />
      ))}
    </svg>
  );
}
