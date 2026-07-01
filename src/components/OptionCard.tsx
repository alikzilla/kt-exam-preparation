import type { QuestionOption } from "../types";

type Variant = "default" | "correct" | "incorrect" | "missed";

/** Русские буквы вариантов ответа: А, Б, В, Г, Д, Е, ... */
export const OPTION_LETTERS = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

// Цвет рамки/фона карточки в режиме разбора.
const shellVariant: Record<Variant, string> = {
  default: "border-line",
  correct: "border-success/50 bg-success/5",
  incorrect: "border-danger/50 bg-danger/5",
  missed: "border-success/40 bg-success/5 border-dashed",
};

// Цвет бейджа с буквой в режиме разбора.
const badgeVariant: Record<Variant, string> = {
  default: "",
  correct: "bg-success text-white border-transparent",
  incorrect: "bg-danger text-white border-transparent",
  missed: "border-success/60 text-success",
};

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
  const isReview = variant !== "default";

  const interactive =
    disabled || isReview
      ? "cursor-default"
      : "cursor-pointer hover:border-accent/60 hover:bg-accent/5";

  const selectedShell =
    selected && !isReview ? "border-accent bg-accent/5" : "";

  const shell = isReview ? shellVariant[variant] : "border-line";

  const badge = isReview
    ? badgeVariant[variant] || "border-line bg-surface text-ink-faint"
    : selected
      ? "bg-accent text-white border-transparent"
      : "border-line bg-surface text-ink-faint";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle?.(option.id)}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm text-ink transition-colors duration-150 ${shell} ${interactive} ${selectedShell}`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center border text-xs font-semibold transition-colors ${
          multiCorrect ? "rounded-md" : "rounded-full"
        } ${badge}`}
      >
        {letter ?? (selected ? "✓" : "")}
      </span>
      <span className="flex-1 leading-snug">{option.text}</span>
    </button>
  );
}
