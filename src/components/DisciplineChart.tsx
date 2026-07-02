import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DisciplineStat } from "../lib/stats";
import { getSubjectName } from "../data";
import { useChartColors, tooltipStyles } from "./chartTheme";

const MAX_TICK = 16;

const truncate = (s: string) =>
  s.length > MAX_TICK ? `${s.slice(0, MAX_TICK - 1)}…` : s;

/** Результаты по дисциплинам: горизонтальные бары 0..100%. */
export default function DisciplineChart({ data }: { data: DisciplineStat[] }) {
  const c = useChartColors();
  const rows = data.map((d) => ({ ...d, name: getSubjectName(d.subjectId) }));
  // Высота под количество дисциплин, чтобы бары не сжимались.
  const height = rows.length * 48 + 28;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke={c.line} strokeDasharray="4 5" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fill: c.inkFaint, fontSize: 11 }}
            axisLine={{ stroke: c.line }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={118}
            tickFormatter={truncate}
            tick={{ fill: c.inkSoft, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            {...tooltipStyles(c)}
            cursor={{ fill: c.surface2, opacity: 0.5 }}
            formatter={(value, _name, item) => {
              const d = item.payload as DisciplineStat;
              return [`${value}% (${d.correct}/${d.total})`, "Верно"];
            }}
          />
          <Bar
            dataKey="percent"
            fill={c.accent}
            radius={[0, 4, 4, 0]}
            barSize={14}
            background={{ fill: c.surface2, radius: 4 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
