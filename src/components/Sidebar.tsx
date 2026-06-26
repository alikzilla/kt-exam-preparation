import { NavLink } from "react-router-dom";
import {
  DashboardIcon,
  TestsIcon,
  HistoryIcon,
  CloseIcon,
} from "./icons";

const NAV = [
  { to: "/", label: "Дашборд", Icon: DashboardIcon, end: true },
  { to: "/tests", label: "Тесты", Icon: TestsIcon, end: false },
  { to: "/history", label: "История", Icon: HistoryIcon, end: false },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-1 px-3">
      {NAV.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
            }`
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-6 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
        КТ
      </div>
      <div className="leading-tight">
        <div className="text-sm font-bold text-slate-900 dark:text-white">
          Подготовка
        </div>
        <div className="text-xs text-slate-400">магистратура М094</div>
      </div>
    </div>
  );
}

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Десктоп: фиксированная боковая панель */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
        <Brand />
        <NavItems />
      </aside>

      {/* Мобайл: выезжающая панель */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={onClose}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-4 rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Закрыть меню"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            <Brand />
            <NavItems onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
