import { useEffect, useRef, useState } from "react";
import { useTheme, type Theme } from "./ThemeProvider";
import { SunIcon, MoonIcon, MonitorIcon, CheckIcon } from "../components/icons";

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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[1];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Тема оформления: ${current.label}`}
        title="Тема оформления"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 items-center gap-1 rounded-lg border border-line bg-surface-2 px-2 text-ink-soft transition-colors hover:text-ink"
      >
        <current.Icon className="h-4 w-4" />
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3 w-3 text-ink-faint transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path d="m3 4.5 3 3 3-3" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Тема оформления"
          className="absolute right-0 top-full z-40 mt-1.5 w-40 rounded-lg border border-line bg-surface p-1 shadow-lg"
        >
          {OPTIONS.map(({ value, label, Icon }) => {
            const active = theme === value;
            return (
              <li key={value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    setTheme(value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                    active
                      ? "text-accent"
                      : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{label}</span>
                  {active && <CheckIcon className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
