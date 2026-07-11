import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  CalendarDays,
  Clock3,
  Loader2,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { DashboardLayout } from "../components/dashboard/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchMyAttendanceHistory,
  type HistoryRange,
} from "../services/attendanceApi";
import type { AttendanceRecord } from "../types/attendance";

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function durationLabel(minutes: number | null) {
  if (minutes == null) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function HistoryCard({ record }: { record: AttendanceRecord }) {
  const dateSource = record.time_in ?? record.date;

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#0B2545]">
            {formatDateLabel(dateSource)}
          </p>
          <p className="mt-0.5 text-xs capitalize text-slate-500">
            {record.status}
            {record.punctuality ? ` · ${record.punctuality.replace("_", " ")}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          {record.time_out ? "Complete" : record.time_in ? "Open" : "Absent"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Clock in
          </p>
          <p className="mt-1 font-semibold text-slate-800">
            {formatTime(record.time_in)}
          </p>
          {record.time_in_method && (
            <p className="mt-0.5 text-xs capitalize text-slate-500">
              via {record.time_in_method}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Clock out
          </p>
          <p className="mt-1 font-semibold text-slate-800">
            {formatTime(record.time_out)}
          </p>
          {record.time_out_method && (
            <p className="mt-0.5 text-xs capitalize text-slate-500">
              via {record.time_out_method}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5" />
          {durationLabel(record.duration_minutes)}
        </span>
        {record.clock_in_location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {record.clock_in_location}
          </span>
        )}
      </div>
    </article>
  );
}

export function History() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<HistoryRange>("month");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchMyAttendanceHistory(page, range);
      setRecords(response.data ?? []);
      setHasNext(response.meta?.has_next ?? false);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        setError(
          "History endpoint is not available yet. Once your backend exposes GET /attendance/me, records will appear here.",
        );
      } else if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message ||
            "Could not load attendance history.",
        );
      } else {
        setError("Could not load attendance history.");
      }
      setRecords([]);
      setHasNext(false);
    } finally {
      setLoading(false);
    }
  }, [page, range]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  return (
    <DashboardLayout
      menuOpen={menuOpen}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onLogout={handleLogout}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0B2545]">History</h2>
        <p className="mt-1 text-sm text-slate-500">Your attendance records</p>
      </div>

      <div className="mb-4 flex items-center gap-2">
        {(["week", "month", "all"] as HistoryRange[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setPage(1);
              setRange(option);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
              range === option
                ? "bg-[#0B2545] text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {option}
          </button>
        ))}
        <button
          type="button"
          onClick={loadHistory}
          disabled={loading}
          aria-label="Refresh history"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#0B2545] ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#0B2545]" />
          <p className="text-sm font-medium">Loading history…</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <CalendarDays className="h-4 w-4" />
            History not connected yet
          </div>
          <p>{error}</p>
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="font-semibold text-slate-700">No records yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Your clock-in and clock-out history will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <HistoryCard key={record.log_id} record={record} />
          ))}

          {(page > 1 || hasNext) && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0B2545] ring-1 ring-slate-200 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs font-medium text-slate-500">
                Page {page}
              </span>
              <button
                type="button"
                disabled={!hasNext || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0B2545] ring-1 ring-slate-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

export default History;
