// src/pages/Profile.tsx

import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  CalendarDays,
  Loader2,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Mail,
  Clock,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Users,
  UserCheck,
  UserX,
  Clock as ClockIcon,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { DashboardLayout } from "../components/dashboard/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/axiosConfig";
import { cn } from "../lib/utils";

// ============================================
// Types
// ============================================

type PeriodFilter = "week" | "month" | "all";

interface TeacherStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  on_time_days: number;
  late_days: number;
  attendance_rates: {
    present_rate: number;
    absent_rate: number;
    on_time_rate: number;
    late_rate: number;
  };
}

// ============================================
// KPI Card Component with Trend
// ============================================

const KPI_STYLES = {
  total: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    iconBg: "bg-[#2563EB]",
    icon: Users,
  },
  present: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    iconBg: "bg-[#16A34A]",
    icon: UserCheck,
  },
  absent: {
    bg: "bg-red-50",
    text: "text-red-800",
    iconBg: "bg-[#DC2626]",
    icon: UserX,
  },
  late: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    iconBg: "bg-[#D97706]",
    icon: ClockIcon,
  },
  onTime: {
    bg: "bg-teal-50",
    text: "text-teal-800",
    iconBg: "bg-[#0D9488]",
    icon: CheckCircle2,
  },
} as const;

interface KpiCardProps {
  label: string;
  value: number;
  rate?: number;
  tone: keyof typeof KPI_STYLES;
}

function KpiCard({ label, value, rate, tone }: KpiCardProps) {
  const style = KPI_STYLES[tone];
  const Icon = style.icon;

  const getTrend = () => {
    if (rate === undefined) return null;
    if (tone === "absent" || tone === "late") {
      if (rate < 10)
        return {
          icon: TrendingUp,
          label: "Excellent",
          color: "text-emerald-600",
        };
      if (rate < 25)
        return { icon: TrendingUp, label: "Good", color: "text-blue-600" };
      if (rate < 50)
        return {
          icon: TrendingDown,
          label: "Needs attention",
          color: "text-amber-600",
        };
      return { icon: TrendingDown, label: "High", color: "text-red-600" };
    } else {
      if (rate >= 90)
        return {
          icon: TrendingUp,
          label: "Excellent",
          color: "text-emerald-600",
        };
      if (rate >= 75)
        return { icon: TrendingUp, label: "Good", color: "text-blue-600" };
      if (rate >= 50)
        return {
          icon: TrendingDown,
          label: "Needs improvement",
          color: "text-amber-600",
        };
      return { icon: TrendingDown, label: "Low", color: "text-red-600" };
    }
  };

  const trend = getTrend();

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 p-4 flex flex-col hover:shadow-sm transition-shadow",
        style.bg,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={cn(
            "w-7 h-7 rounded-full grid place-items-center shrink-0",
            style.iconBg,
            "text-white",
          )}
        >
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <p
          className={cn("text-[28px] font-extrabold leading-none", style.text)}
        >
          {value}
        </p>
        {trend && rate !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-semibold",
              trend.color,
            )}
          >
            <trend.icon className="w-3.5 h-3.5" />
            <span>{rate}%</span>
          </div>
        )}
      </div>
      {trend && rate !== undefined && (
        <p className="text-[10px] font-medium text-slate-500 mt-1">
          {trend.label} ({rate}%)
        </p>
      )}
    </div>
  );
}

// ============================================
// Filter Select Component
// ============================================

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-[12.5px] cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

// ============================================
// Components
// ============================================

function formatMemberSince(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function ProfileField({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 hover:shadow-sm transition-shadow">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B2545]/5 text-[#0B2545]">
        <Icon className="h-4 w-4" strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-[#0B2545] truncate">
          {value}
        </p>
        {subValue && (
          <p className="text-xs text-slate-500 mt-0.5">{subValue}</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function Profile() {
  const { teacher: cachedTeacher, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(!cachedTeacher);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>("month"); // Default to month

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await api.get("/teachers/stats", {
        params: { period },
      });
      setStats(data.data);
    } catch (err) {
      console.log("Stats not available");
    } finally {
      setStatsLoading(false);
    }
  }, [period]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await loadStats();
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Could not load your profile.");
      } else {
        setError("Could not load your profile.");
      }
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Reload stats when period changes
  useEffect(() => {
    if (!loading) {
      loadStats();
    }
  }, [period, loadStats]);

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  const profile = cachedTeacher;
  const initials = profile
    ? `${profile.firstname?.[0] ?? ""}${profile.lastname?.[0] ?? ""}`.toUpperCase()
    : "T";

  const fullName = profile
    ? `${profile.firstname} ${profile.lastname}`.trim()
    : "Teacher";

  const displayStats = stats || {
    total_days: 0,
    present_days: 0,
    absent_days: 0,
    on_time_days: 0,
    late_days: 0,
    attendance_rates: {
      present_rate: 0,
      absent_rate: 0,
      on_time_rate: 0,
      late_rate: 0,
    },
  };

  // Get period label for display
  const getPeriodLabel = (p: PeriodFilter) => {
    switch (p) {
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "all":
        return "All Time";
      default:
        return "This Month";
    }
  };

  return (
    <DashboardLayout
      menuOpen={menuOpen}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onLogout={handleLogout}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#0B2545]">My Profile</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage your personal information and attendance overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Period Filter */}
            <FilterSelect
              value={period}
              onChange={(v) => setPeriod(v as PeriodFilter)}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </FilterSelect>

            <button
              type="button"
              onClick={loadProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0B2545] ring-1 ring-slate-200 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#0B2545]" />
            <p className="text-sm font-medium">Loading profile…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 text-red-600" />
              <div>
                <p className="font-semibold">Something went wrong</p>
                <p className="mt-1">{error}</p>
                <button
                  type="button"
                  onClick={loadProfile}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0B2545] ring-1 ring-red-200 hover:bg-red-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : profile ? (
          <>
            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="relative">
                <div className="h-32 bg-gradient-to-r from-[#0B2545] to-[#1a3a5c] sm:h-40" />
                <div className="absolute -bottom-12 left-6 sm:left-8">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white shadow-lg ring-4 ring-white text-2xl font-bold text-[#0B2545]">
                    {initials}
                  </div>
                </div>
              </div>

              <div className="pt-16 pb-6 px-6 sm:px-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-[#0B2545]">
                      {fullName}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="text-sm text-slate-500 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {profile.email}
                      </span>
                      {profile.roles?.length &&
                        profile.roles.map((pf: any, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            {pf}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      <CalendarDays className="h-3 w-3" />
                      {formatMemberSince(profile.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#0B2545]">
                  Attendance Overview {getPeriodLabel(period)}
                </h3>
                <span className="text-xs text-slate-400">
                  {displayStats.total_days} school days
                </span>
              </div>

              {statsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-28 rounded-xl bg-slate-50 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <KpiCard
                    label="Total Days"
                    value={displayStats.total_days}
                    tone="total"
                  />
                  <KpiCard
                    label="Present"
                    value={displayStats.present_days}
                    rate={displayStats.attendance_rates.present_rate}
                    tone="present"
                  />
                  <KpiCard
                    label="Absent"
                    value={displayStats.absent_days}
                    rate={displayStats.attendance_rates.absent_rate}
                    tone="absent"
                  />
                  <KpiCard
                    label="On Time"
                    value={displayStats.on_time_days}
                    rate={displayStats.attendance_rates.on_time_rate}
                    tone="onTime"
                  />
                  <KpiCard
                    label="Late"
                    value={displayStats.late_days}
                    rate={displayStats.attendance_rates.late_rate}
                    tone="late"
                  />
                </div>
              )}
            </div>

            {/* Personal Details */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[#0B2545] mb-3">
                Personal Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProfileField
                  icon={UserRound}
                  label="Full Name"
                  value={fullName}
                />
                <ProfileField
                  icon={Mail}
                  label="Email Address"
                  value={profile.email}
                />
                <ProfileField
                  icon={Phone}
                  label="Phone Number"
                  value={profile.phone || "—"}
                />
                <ProfileField
                  icon={CalendarDays}
                  label="Member Since"
                  value={formatMemberSince(profile.created_at)}
                  subValue={
                    profile.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : ""
                  }
                />
                <ProfileField
                  icon={GraduationCap}
                  label="Role"
                  value={profile.roles?.join(", ") || "Teacher"}
                />
                <ProfileField
                  icon={Clock}
                  label="Status"
                  value="Active"
                  subValue="Currently logged in"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 border-t border-slate-200 pt-6">
              <h3 className="text-sm font-semibold text-[#0B2545] mb-3">
                Quick Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/history")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0B2545] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a3a5c] transition-colors"
                >
                  <CalendarDays className="h-4 w-4" />
                  View Attendance History
                </button>
                <button
                  type="button"
                  onClick={loadProfile}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0B2545] ring-1 ring-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Profile
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

export default Profile;
