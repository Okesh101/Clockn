import { useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { useLiveClock } from "../../hooks/useLiveClock";

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function DashboardSidebar({
  open,
  onClose,
  onLogout,
}: DashboardSidebarProps) {
  const location = useLocation();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-hidden={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col bg-[#0B2545] text-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-lg font-bold tracking-tight">Clock'n</p>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
              Teacher Menu
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-4">
          {[
            { to: "/", label: "Home" },
            { to: "/history", label: "History" },
          ].map(({ to, label }) => {
            const active =
              to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(to);

            return (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-slate-100 hover:bg-white/10"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 active:scale-[0.98]"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

interface DashboardHeaderProps {
  onMenuOpen: () => void;
}

export function DashboardHeader({ onMenuOpen }: DashboardHeaderProps) {
  const { time, seconds, period } = useLiveClock();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[#0B2545] transition hover:bg-slate-100 active:scale-95"
        >
          <Menu className="h-5 w-5" strokeWidth={2.2} />
        </button>

        <h1 className="text-lg font-bold tracking-tight text-[#0B2545]">
          Clock'n
        </h1>

        <div
          className="min-w-[5.5rem] rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-right tabular-nums"
          aria-live="polite"
          aria-label="Current time"
        >
          <div className="text-sm font-bold leading-none text-[#0B2545]">
            {time}
            <span className="text-[10px] font-semibold text-slate-400">
              :{seconds}
            </span>
          </div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {period}
          </div>
        </div>
      </div>
    </header>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  menuOpen: boolean;
  onMenuOpen: () => void;
  onMenuClose: () => void;
}

export function DashboardLayout({
  children,
  onLogout,
  menuOpen,
  onMenuOpen,
  onMenuClose,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
      <DashboardHeader onMenuOpen={onMenuOpen} />
      <DashboardSidebar
        open={menuOpen}
        onClose={onMenuClose}
        onLogout={onLogout}
      />
      <main className="mx-auto max-w-lg px-4 pb-8 pt-6">{children}</main>
    </div>
  );
}
