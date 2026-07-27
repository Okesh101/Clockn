import { useEffect } from "react";
import {
  Clock3,
  History,
  Home,
  List,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { usePersistentSidebar } from "../../hooks/useMediaQuery";
import { DashboardClockBar } from "./DashboardClockBar";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/history", label: "History", icon: History },
  { to: "/my-requests", label: "My Requests", icon: List },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

interface DashboardLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  menuOpen: boolean;
  onMenuOpen: () => void;
  onMenuClose: () => void;
}

function SidebarNav({
  onNavigate,
  onLogout,
  showClose = false,
  onClose,
}: {
  onNavigate?: () => void;
  onLogout: () => void;
  showClose?: boolean;
  onClose?: () => void;
}) {
  const location = useLocation();
  const { teacher } = useAuth();

  const initials = teacher
    ? `${teacher.firstname?.[0] ?? ""}${teacher.lastname?.[0] ?? ""}`.toUpperCase()
    : "T";

  const fullName = teacher
    ? `${teacher.firstname} ${teacher.lastname}`.trim()
    : "Teacher";

  return (
    <>
      <div className="border-b border-white/10 px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-sm font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{fullName}</p>
              <p className="truncate text-xs text-slate-300">
                {teacher?.email}
              </p>
            </div>
          </div>
          {showClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="shrink-0 rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
          <Clock3 className="h-4 w-4 shrink-0 text-emerald-300" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
            Clock'n Teacher Portal
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 sm:p-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active =
            to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(to);

          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-white text-[#0B2545] shadow-sm"
                  : "text-slate-100 hover:bg-white/10"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3 sm:p-4">
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            onLogout();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 active:scale-[0.98] cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </>
  );
}

export function DashboardLayout({
  children,
  onLogout,
  menuOpen,
  onMenuOpen,
  onMenuClose,
}: DashboardLayoutProps) {
  const isPersistent = usePersistentSidebar();

  useEffect(() => {
    if (isPersistent && menuOpen) {
      onMenuClose();
    }
  }, [isPersistent, menuOpen, onMenuClose]);

  useEffect(() => {
    if (!menuOpen || isPersistent) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onMenuClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, isPersistent, onMenuClose]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,122,64,0.08),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_100%)] md:flex">
      {/* Persistent sidebar — tablet/desktop only */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#0B2545] text-white shadow-xl md:flex lg:w-72">
        <SidebarNav onLogout={onLogout} />
      </aside>

      {/* Mobile drawer — never mounted on persistent layouts */}
      {!isPersistent && menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={onMenuClose}
            className="absolute inset-0 bg-[#0B2545]/60 backdrop-blur-sm"
          />
          <aside className="relative flex h-full w-[min(18rem,88vw)] flex-col bg-[#0B2545] text-white shadow-2xl">
            <SidebarNav
              showClose
              onClose={onMenuClose}
              onNavigate={onMenuClose}
              onLogout={onLogout}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[#0B2545]/10 bg-white/95 backdrop-blur-md md:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <button
              type="button"
              onClick={onMenuOpen}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#0B2545] transition hover:bg-[#0B2545]/5 active:scale-95"
            >
              <Menu className="h-5 w-5" strokeWidth={2.2} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-[#0B2545]">
              Clock'n
            </h1>
            <div className="h-10 w-10" aria-hidden />
          </div>
        </header>

        <DashboardClockBar />

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
