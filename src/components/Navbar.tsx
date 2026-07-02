import { NavLink } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import ThemeToggle from "../theme/ThemeToggle";
import Logo from "./Logo";

const NAV = [
  { to: "/", label: "Дашборд", end: true },
  { to: "/tests", label: "Тесты", end: false },
  { to: "/questions", label: "Вопросы", end: false },
  { to: "/history", label: "История", end: false },
  { to: "/leaderboard", label: "Лидерборд", end: false },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:gap-6 sm:px-6">
        <NavLink
          to="/"
          className="flex shrink-0 items-center gap-2 text-sm font-semibold text-ink"
        >
          <Logo className="h-7 w-7" />
          <span className="hidden sm:inline">КТ Подготовка</span>
        </NavLink>
        <nav className="flex items-center gap-1">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-accent"
                    : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <SignedOut>
            <SignInButton mode="modal">
              <button type="button" className="btn-primary btn-sm">
                Войти
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
