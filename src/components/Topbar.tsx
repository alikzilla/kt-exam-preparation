import { useLocation } from "react-router-dom";
import ThemeToggle from "../theme/ThemeToggle";
import { MenuIcon } from "./icons";

function metaForPath(pathname: string): { eyebrow: string; title: string } {
  if (pathname === "/")
    return { eyebrow: "Обзор", title: "Дашборд" };
  if (pathname.startsWith("/tests"))
    return { eyebrow: "Выбор формата", title: "Тесты" };
  if (pathname.startsWith("/history"))
    return { eyebrow: "Журнал попыток", title: "История" };
  if (pathname.startsWith("/test"))
    return { eyebrow: "Идёт сессия", title: "Тестирование" };
  if (pathname.startsWith("/results"))
    return { eyebrow: "Итоги", title: "Результат" };
  return { eyebrow: "", title: "КТ Подготовка" };
}

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation();
  const { eyebrow, title } = metaForPath(pathname);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/80 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-8">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-lg p-1.5 text-ink-soft transition hover:bg-surface-2 hover:text-ink md:hidden"
          aria-label="Открыть меню"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <div className="flex-1 leading-tight">
          {eyebrow && (
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink-faint">
              {eyebrow}
            </div>
          )}
          <h1 className="font-display text-base font-bold tracking-tight text-ink">
            {title}
          </h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
