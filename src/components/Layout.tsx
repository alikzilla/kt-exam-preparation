import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import MigrationPrompt from "./MigrationPrompt";

export default function Layout() {
  return (
    <div className="min-h-screen text-ink">
      <Navbar />
      <MigrationPrompt />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
