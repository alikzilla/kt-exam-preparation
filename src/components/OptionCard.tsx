import type { QuestionOption } from "../types";

type Variant = "default" | "correct" | "incorrect" | "missed";

const variantClasses: Record<Variant, string> = {
  default: "",
  correct:
    "border-emerald-400 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-500/10",
  incorrect:
    "border-rose-400 bg-rose-50 dark:border-rose-500/60 dark:bg-rose-500/10",
  missed:
    "border-emerald-400 bg-emerald-50/60 dark:border-emerald-500/50 dark:bg-emerald-500/5",
};

/** Русские буквы вариантов ответа: А, Б, В, Г, Д, Е, ... */
export const OPTION_LETTERS = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

export default function OptionCard({
  option,
  letter,
  selected,
  multiCorrect,
  disabled = false,
  variant = "default",
  onToggle,
}: {
  option: QuestionOption;
  letter?: string;
  selected: boolean;
  multiCorrect: boolean;
  disabled?: boolean;
  variant?: Variant;
  onToggle?: (optionId: string) => void;
}) {
  const base =
    "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition";
  const interactive = disabled
    ? "cursor-default"
    : "cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10";
  const selectedRing =
    selected && variant === "default"
      ? "border-indigo-500 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-500/10"
      : "";
  const border =
    variant === "default"
      ? "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
      : "text-slate-700 dark:text-slate-100";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle?.(option.id)}
      className={`${base} ${border} ${interactive} ${selectedRing} ${variantClasses[variant]}`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center text-xs font-semibold ${
          multiCorrect ? "rounded" : "rounded-full"
        } ${
          selected
            ? "bg-indigo-500 text-white"
            : "border border-slate-300 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
        }`}
      >
        {letter ?? (selected ? "✓" : "")}
      </span>
      <span className="flex-1">{option.text}</span>
    </button>
  );
}
