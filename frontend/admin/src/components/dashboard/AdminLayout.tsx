import { useEffect } from "react";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Shield,
  Users,
  X,
  CalendarDays,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { usePersistentSidebar } from "../../hooks/useMediaQuery";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teachers", label: "Teachers", icon: Users },
  { to: "/attendance-logs", label: "Attendance Logs", icon: CalendarDays },
  { to: "/qrcodes", label: "QR Codes", icon: QrCode },
  { to: "/roles", label: "Roles & Permissions", icon: Shield },
] as const;

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  menuOpen: boolean;
  onMenuOpen: () => void;
  onMenuClose: () => void;
  onLogout: () => void;
  headerExtra?: React.ReactNode;
}

function SidebarPanel({
  onNavigate,
  onLogout,
  showClose,
  onClose,
}: {
  onNavigate?: () => void;
  onLogout: () => void;
  showClose?: boolean;
  onClose?: () => void;
}) {
  const location = useLocation();
  const { admin } = useAuth();

  const initials = admin
    ? `${admin.firstname?.[0] ?? ""}${admin.lastname?.[0] ?? ""}`.toUpperCase()
    : "AU";

  const name = admin
    ? `${admin.firstname} ${admin.lastname}`.trim()
    : "Admin User";

  return (
    <>
      <div className="border-b border-white/10 px-4 py-5 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-lg font-bold">
              {initials}
            </div>
            <div>
              <p className="font-bold">{name}</p>
              <p className="text-xs text-slate-300">Admin User</p>
            </div>
          </div>
          {showClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="rounded-xl p-2 text-slate-300 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 sm:p-4">
        {NAV.map(({ to, label, icon: Icon }) => {
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
              <Icon className="h-4 w-4 shrink-0" />
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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/15"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </>
  );
}

export function AdminLayout({
  children,
  title = "Clock'n — Admin Portal",
  menuOpen,
  onMenuOpen,
  onMenuClose,
  onLogout,
  headerExtra,
}: AdminLayoutProps) {
  const isPersistent = usePersistentSidebar();

  useEffect(() => {
    if (isPersistent && menuOpen) onMenuClose();
  }, [isPersistent, menuOpen, onMenuClose]);

  useEffect(() => {
    if (!menuOpen || isPersistent) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen, isPersistent]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,122,64,0.06),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_100%)] md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#0B2545] text-white shadow-xl md:flex lg:w-72">
        <SidebarPanel onLogout={onLogout} />
      </aside>

      {!isPersistent && menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={onMenuClose}
            className="absolute inset-0 bg-[#0B2545]/60 backdrop-blur-sm"
          />
          <aside className="relative flex h-full w-[min(18rem,88vw)] flex-col bg-[#0B2545] text-white shadow-2xl">
            <SidebarPanel
              showClose
              onClose={onMenuClose}
              onNavigate={onMenuClose}
              onLogout={onLogout}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[#0B2545]/10 bg-white/95 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={onMenuOpen}
                aria-label="Open menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#0B2545] hover:bg-[#0B2545]/5 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-[#0B2545] sm:text-lg">
                  {title}
                </h1>
              </div>
            </div>
            {headerExtra}
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
