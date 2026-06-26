import { useTheme, type Theme } from "./ThemeProvider";

const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "Светлая", icon: "☀" },
  { value: "system", label: "Системная", icon: "🖥" },
  { value: "dark", label: "Тёмная", icon: "☾" },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={active}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-sm transition ${
              active
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-950 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <span aria-hidden>{opt.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
