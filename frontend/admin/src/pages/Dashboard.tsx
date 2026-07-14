// src/pages/Dashboard.tsx

import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Loader2, RefreshCw, UserCheck, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AttendanceTable } from "../components/AttendanceTable";
import { DateRangeFilter } from "../components/DateRangeFilter";
import { DashboardClockBar } from "../components/DashboardClockBar";
import { AdminLayout } from "../components/dashboard/AdminLayout";
import { KpiCard } from "../components/KpiCard";
import { Button } from "../components/ui/form";
import { useAuth } from "../contexts/AuthContext";
import { useTimeGreeting } from "../hooks/useTimeGreeting";
import {
  fetchAttendanceLogs,
  fetchAttendanceStats,
} from "../services/attendanceApi";
import type {
  AttendanceRange,
  AttendanceStats,
  TeacherAttendanceRow,
} from "../types/attendance";

export function Dashboard() {
  const { admin, logout } = useAuth();
  const { greeting } = useTimeGreeting();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [range, setRange] = useState<AttendanceRange>("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [rows, setRows] = useState<TeacherAttendanceRow[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateParams =
    range === "custom" && startDate && endDate
      ? { start_date: startDate, end_date: endDate }
      : undefined;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, logsRes] = await Promise.all([
        fetchAttendanceStats(range, dateParams),
        fetchAttendanceLogs(page, range, dateParams),
      ]);
      setStats(statsRes.data ?? null);
      setRows(logsRes.data ?? []);
      setHasNext(logsRes.meta?.has_next ?? false);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message || "Failed to load dashboard data.",
        );
      } else {
        setError("Failed to load dashboard data.");
      }
      setStats(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [range, page, startDate, endDate]);

  useEffect(() => {
    if (range === "custom" && (!startDate || !endDate)) return;
    loadData();
  }, [loadData, range, startDate, endDate]);

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  const adminName = admin
    ? `${admin.firstname} ${admin.lastname}`.trim()
    : "Admin User";

  const getRangeLabel = (base: string) => {
    if (range === "today") return `${base} Today`;
    if (range === "yesterday") return `${base} Yesterday`;
    if (range === "week") return `${base} This Week`;
    if (range === "month") return `${base} This Month`;
    return `${base} This Period`;
  };

  return (
    <AdminLayout
      menuOpen={menuOpen}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onLogout={handleLogout}
      headerExtra={
        <>
          <DashboardClockBar />
          <DateRangeFilter
            value={range}
            onChange={(value) => {
              setPage(1);
              setRange(value);
            }}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </>
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="mb-6">
          <p className="text-sm font-medium text-slate-600">{greeting},</p>
          <h2 className="text-2xl font-bold text-[#0B2545] sm:text-3xl">
            {adminName}
          </h2>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            {error}
          </div>
        ) : (
          <>
            {/* Main KPI Cards */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
              <KpiCard
                label="Total Teachers"
                value={stats?.total_teachers ?? 0}
                tone="teachers"
              />
              <KpiCard
                label={getRangeLabel("Present")}
                value={stats?.total_present ?? 0}
                tone="present"
              />
              <KpiCard
                label={getRangeLabel("Late")}
                value={stats?.total_late ?? 0}
                tone="late"
              />
              <KpiCard
                label={getRangeLabel("Absent")}
                value={stats?.total_absent ?? 0}
                tone="absent"
              />
              <KpiCard
                label={getRangeLabel("On Time")}
                value={stats?.total_on_time ?? 0}
                tone="ontime"
              />
            </section>

            {/* Today's Snapshot - Only show when range is 'today' */}
            {range === "today" && stats?.snapshot_today && (
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4 mt-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col hover:shadow-sm transition-shadow bg-emerald-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 rounded-full grid place-items-center shrink-0 bg-[#16A34A] text-white">
                      <UserCheck className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Present Today
                    </span>
                  </div>
                  <p className="text-[28px] font-extrabold leading-none text-emerald-800">
                    {stats.snapshot_today.present}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col hover:shadow-sm transition-shadow bg-red-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 rounded-full grid place-items-center shrink-0 bg-[#DC2626] text-white">
                      <AlertCircle className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Absent Today
                    </span>
                  </div>
                  <p className="text-[28px] font-extrabold leading-none text-red-800">
                    {stats.snapshot_today.absent}
                  </p>
                </div>
              </section>
            )}

            {/* Attendance Logs Table */}
            <section className="mt-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-[#0B2545]">
                  Attendance Logs
                </h3>
                <Button
                  type="button"
                  onClick={loadData}
                  className="h-9 bg-white px-3 text-[#0B2545] ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {startDate && endDate ? (
                <AttendanceTable
                  rows={rows}
                  range={range}
                  startDate={startDate}
                  endDate={endDate}
                  page={page}
                />
              ) : (
                <AttendanceTable rows={rows} range={range} page={page} />
              )}

              {(page > 1 || hasNext) && (
                <div className="mt-4 flex items-center justify-between">
                  <Button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-9 bg-white px-4 text-[#0B2545] ring-1 ring-slate-200 disabled:opacity-40"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-slate-500">Page {page}</span>
                  <Button
                    type="button"
                    disabled={!hasNext}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-9 bg-white px-4 text-[#0B2545] ring-1 ring-slate-200 disabled:opacity-40"
                  >
                    Next
                  </Button>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default Dashboard;
