import type { Subject } from "../types";
import { CheckIcon } from "./icons";

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
        const count = counts[subject.id] ?? subject.defaultQuestionCount;
        const clamp = (v: number) => Math.max(1, Math.min(pool, v));

        return (
          <div
            key={subject.id}
            className={`rounded-card border p-4 transition duration-200 ${
              isOn
                ? "border-accent/40 bg-accent/5 shadow-card"
                : "border-line bg-surface"
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={isOn}
                onClick={() => onToggle(subject.id)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                  isOn
                    ? "border-accent bg-accent text-white"
                    : "border-line bg-surface text-transparent hover:border-accent/60"
                }`}
                aria-label={`Включить ${subject.name}`}
              >
                <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
              </button>
              <button
                type="button"
                onClick={() => onToggle(subject.id)}
                className="flex flex-1 items-center justify-between text-left"
              >
                <span className="font-medium text-ink">{subject.name}</span>
                <span className="chip">{pool} в банке</span>
              </button>
            </div>

            {isOn && (
              <div className="mt-3 flex items-center justify-between gap-3 pl-8">
                <span className="text-sm text-ink-soft">Вопросов в наборе</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onCountChange(subject.id, clamp(count - 1))}
                    disabled={count <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-lg leading-none text-ink-soft transition hover:bg-surface-2 disabled:opacity-40"
                    aria-label="Меньше вопросов"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={pool}
                    value={count}
                    onChange={(e) =>
                      onCountChange(subject.id, clamp(Number(e.target.value)))
                    }
                    className="field w-16 text-center font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => onCountChange(subject.id, clamp(count + 1))}
                    disabled={count >= pool}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-lg leading-none text-ink-soft transition hover:bg-surface-2 disabled:opacity-40"
                    aria-label="Больше вопросов"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
