import type { ReactNode } from "react";

export default function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "indigo",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone?: "indigo" | "emerald" | "amber" | "sky";
}) {
  const toneClasses: Record<string, string> = {
    indigo:
      "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {label}
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </div>
          {hint && (
            <div className="mt-1 text-xs text-slate-400">{hint}</div>
          )}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
