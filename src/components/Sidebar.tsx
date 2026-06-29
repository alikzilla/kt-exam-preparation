import { NavLink } from "react-router-dom";
import { DashboardIcon, TestsIcon, HistoryIcon, CloseIcon } from "./icons";

const NAV = [
  { to: "/", label: "Дашборд", Icon: DashboardIcon, end: true },
  { to: "/tests", label: "Тесты", Icon: TestsIcon, end: false },
  { to: "/history", label: "История", Icon: HistoryIcon, end: false },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-1 px-4">
      {NAV.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-surface-2 text-ink"
                : "text-ink-soft hover:bg-surface-2/60 hover:text-ink"
            }`
          }
        >
          {({ isActive }) => (
            <>
              {/* Акцентная вертикальная засечка активного пункта. */}
              <span
                className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent transition-all duration-200 ${
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                }`}
              />
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-6 py-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink font-display text-sm font-bold text-paper">
        КТ
      </div>
      <div className="leading-tight">
        <div className="font-display text-sm font-bold tracking-tight text-ink">
          Подготовка
        </div>
        <div className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-faint">
          магистратура М094
        </div>
      </div>
    </div>
  );
}

function ExamMeta() {
  return (
    <div className="mt-auto px-4 pb-6">
      <div className="surface-2 space-y-2 p-4">
        <div className="eyebrow">Формат КТ</div>
        <dl className="space-y-1.5 text-xs text-ink-soft">
          <div className="flex justify-between">
            <dt>Вопросов</dt>
            <dd className="font-mono font-semibold text-ink">50</dd>
          </div>
          <div className="flex justify-between">
            <dt>Время</dt>
            <dd className="font-mono font-semibold text-ink">100 мин</dd>
          </div>
          <div className="flex justify-between">
            <dt>Порог</dt>
            <dd className="font-mono font-semibold text-ink">≥ 7 / дисц.</dd>
          </div>
        </dl>
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-line bg-surface/70 backdrop-blur-sm md:flex">
        <Brand />
        <NavItems />
        <ExamMeta />
      </aside>

      {/* Мобайл: выезжающая панель */}
      <div
        className={`fixed inset-0 z-40 md:hidden ${
          open ? "" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-72 flex-col border-r border-line bg-surface shadow-lift transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-5 rounded-lg p-1.5 text-ink-faint transition hover:bg-surface-2 hover:text-ink"
            aria-label="Закрыть меню"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
          <Brand />
          <NavItems onNavigate={onClose} />
          <ExamMeta />
        </aside>
      </div>
    </>
  );
}
