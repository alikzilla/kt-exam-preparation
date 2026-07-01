import { useTheme, type Theme } from "./ThemeProvider";
import { SunIcon, MoonIcon, MonitorIcon } from "../components/icons";

const OPTIONS: {
  value: Theme;
  label: string;
  Icon: typeof SunIcon;
}[] = [
  { value: "light", label: "Светлая", Icon: SunIcon },
  { value: "system", label: "Системная", Icon: MonitorIcon },
  { value: "dark", label: "Тёмная", Icon: MoonIcon },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Тема оформления"
      className="inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface-2 p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            title={label}
            aria-label={label}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              active
                ? "bg-surface text-accent"
                : "text-ink-faint hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
