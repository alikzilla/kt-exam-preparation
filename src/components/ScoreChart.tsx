import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartColors, tooltipStyles } from "./chartTheme";

interface Point {
  takenAt: number;
  percent: number;
}

const fmtTick = (t: number) =>
  new Date(t).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });

const fmtLabel = (t: number) =>
  new Date(t).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** График динамики результатов: 0..100% по вертикали, попытки по горизонтали. */
export default function ScoreChart({ data }: { data: Point[] }) {
  const c = useChartColors();

  if (data.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-ink-faint">
        Пока нет данных — пройдите тест.
      </div>
    );
  }

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.accent} stopOpacity={0.22} />
              <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={c.line} strokeDasharray="4 5" vertical={false} />
          <XAxis
            dataKey="takenAt"
            tickFormatter={fmtTick}
            tick={{ fill: c.inkFaint, fontSize: 11 }}
            axisLine={{ stroke: c.line }}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fill: c.inkFaint, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            {...tooltipStyles(c)}
            labelFormatter={(t) => fmtLabel(Number(t))}
            formatter={(value) => [`${value}%`, "Результат"]}
          />
          <Area
            type="monotone"
            dataKey="percent"
            stroke={c.accent}
            strokeWidth={2.5}
            fill="url(#scoreFill)"
            dot={{ r: 3.5, fill: c.surface, stroke: c.accent, strokeWidth: 2 }}
            activeDot={{ r: 5, fill: c.accent, stroke: c.surface, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
