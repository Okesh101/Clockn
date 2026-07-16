// src/pages/AttendanceLogs.tsx

import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AdminLayout } from "../components/dashboard/AdminLayout";
import { AttendanceTable } from "../components/AttendanceTable";
import { DateRangeFilter } from "../components/DateRangeFilter";
import { Button } from "../components/ui/form";
import { useAuth } from "../contexts/AuthContext";
import { fetchAttendanceLogs } from "../services/attendanceApi";
import type {
  AttendanceRange,
  TeacherAttendanceRow,
} from "../types/attendance";
import { cn } from "../lib/utils";

export function AttendanceLogs() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [range, setRange] = useState<AttendanceRange>("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<TeacherAttendanceRow[]>([]);
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
      const logsRes = await fetchAttendanceLogs(page, range, dateParams);
      setRows(logsRes.data ?? []);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message || "Failed to load attendance logs.",
        );
      } else {
        setError("Failed to load attendance logs.");
      }
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

  return (
    <AdminLayout
      title="Attendance Logs"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#0B2545]">
              Attendance Logs
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Comprehensive view of all attendance records
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => navigate("/")}
              className="h-9 bg-white px-4 text-[#0B2545] ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button
              type="button"
              onClick={loadData}
              className="h-9 bg-white px-3 text-[#0B2545] ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            {error}
          </div>
        ) : (
          <AttendanceTable
            rows={rows}
            range={range}
            startDate={startDate}
            endDate={endDate}
            page={page}
            title="All Attendance Records"
          />
        )}
      </div>
    </AdminLayout>
  );
}

export default AttendanceLogs;
