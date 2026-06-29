import { useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Ключ по маршруту перезапускает анимацию появления при смене страницы.
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen text-ink">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="md:pl-72">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
          <div key={pathname} className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
