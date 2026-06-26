import type { Subject } from "../types";

export default function SubjectPicker({
  subjects,
  selected,
  counts,
  poolSizes,
  onToggle,
  onCountChange,
}: {
  subjects: Subject[];
  selected: Set<string>;
  counts: Record<string, number>;
  poolSizes: Record<string, number>;
  onToggle: (subjectId: string) => void;
  onCountChange: (subjectId: string, count: number) => void;
}) {
  return (
    <div className="space-y-3">
      {subjects.map((subject) => {
        const isOn = selected.has(subject.id);
        const pool = poolSizes[subject.id] ?? 0;
        return (
          <div
            key={subject.id}
            className={`rounded-2xl border p-4 transition ${
              isOn
                ? "border-indigo-300 bg-indigo-50/50 dark:border-indigo-500/40 dark:bg-indigo-500/5"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isOn}
                onChange={() => onToggle(subject.id)}
                className="h-4 w-4 accent-indigo-600"
              />
              <span className="flex-1 font-medium text-slate-900 dark:text-white">
                {subject.name}
              </span>
              <span className="text-xs text-slate-400">{pool} в банке</span>
            </label>

            {isOn && (
              <div className="mt-3 flex items-center gap-2 pl-7 text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Вопросов:
                </span>
                <input
                  type="number"
                  min={1}
                  max={pool}
                  value={counts[subject.id] ?? subject.defaultQuestionCount}
                  onChange={(e) =>
                    onCountChange(subject.id, Number(e.target.value))
                  }
                  className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <span className="text-xs text-slate-400">макс. {pool}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
