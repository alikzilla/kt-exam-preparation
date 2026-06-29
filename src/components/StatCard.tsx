import type { ReactNode } from "react";

type Tone = "accent" | "success" | "warning" | "ink";

const toneClasses: Record<Tone, string> = {
  accent: "bg-accent/12 text-accent",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  ink: "bg-surface-2 text-ink",
};

export default function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "accent",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="surface group relative overflow-hidden p-5">
      {/* Тонкая акцентная подсветка угла при наведении. */}
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-60 ${toneClasses[tone]}`}
      />
      <div className="flex items-start justify-between">
        <div className="eyebrow">{label}</div>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses[tone]}`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-3 font-mono text-3xl font-semibold tracking-tight text-ink">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-ink-faint">{hint}</div>}
    </div>
  );
}
