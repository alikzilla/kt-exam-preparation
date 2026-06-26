import { useLocation } from "react-router-dom";
import ThemeToggle from "../theme/ThemeToggle";
import { MenuIcon } from "./icons";

function titleForPath(pathname: string): string {
  if (pathname === "/") return "Дашборд";
  if (pathname.startsWith("/tests")) return "Тесты";
  if (pathname.startsWith("/history")) return "История";
  if (pathname.startsWith("/test")) return "Тестирование";
  if (pathname.startsWith("/results")) return "Результат";
  return "КТ Подготовка";
}

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Открыть меню"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-base font-semibold text-slate-900 dark:text-white">
          {titleForPath(pathname)}
        </h1>
        <ThemeToggle />
      </div>
    </header>
  );
}
