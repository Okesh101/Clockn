import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AttendanceTable } from "../components/AttendanceTable";
import { DateRangeFilter } from "../components/DateRangeFilter";
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

  return (
    <AdminLayout
      menuOpen={menuOpen}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onLogout={handleLogout}
      headerExtra={
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
      }
    >
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
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            <KpiCard
              label="Total Teachers"
              value={stats?.total_teachers ?? 0}
              tone="teachers"
            />
            <KpiCard
              label={getRange(range, "Present")}
              value={stats?.total_present ?? 0}
              tone="present"
            />
            <KpiCard
              label={getRange(range, "Late")}
              value={stats?.total_late ?? 0}
              tone="late"
            />
            <KpiCard
              label={getRange(range, "Absent")}
              value={stats?.total_absent ?? 0}
              tone="absent"
            />
            <KpiCard
              label={getRange(range, "On Time")}
              value={stats?.total_on_time ?? 0}
              tone="ontime"
            />
          </section>

          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-[#0B2545]">
                Live Attendance Logs
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
    </AdminLayout>
  );
}

const getRange = (rng: AttendanceRange, spec: string) => {
  if (rng === "today") return `${spec} Today`;
  else if (rng === "yesterday") return `${spec} Yesterday`;
  else if (rng === "week") return `${spec} This Week`;
  else if (rng === "month") return `${spec} This Month`;
  return `${spec} This Period`;
};

export default Dashboard;
