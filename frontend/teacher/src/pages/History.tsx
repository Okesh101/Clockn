// src/pages/History.tsx
import { useCallback, useEffect, useState, useMemo } from "react";
import { AxiosError } from "axios";
import {
  CalendarDays,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { DashboardLayout } from "../components/dashboard/DashboardLayout";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchMyAttendanceHistory,
  type HistoryRange,
  type HistoryResponse,
} from "../services/attendanceApi";
import type { AttendanceRecord } from "../types/attendance";
import { cn } from "../lib/utils";

// ============================================
// Types
// ============================================

interface HistoryStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  onTime: number;
}

// ============================================
// KPI Cards Component
// ============================================

const KPI_STYLES = {
  total: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    iconBg: "bg-[#2563EB]",
  },
  present: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    iconBg: "bg-[#16A34A]",
  },
  absent: {
    bg: "bg-red-50",
    text: "text-red-800",
    iconBg: "bg-[#DC2626]",
  },
  late: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    iconBg: "bg-[#D97706]",
  },
  onTime: {
    bg: "bg-teal-50",
    text: "text-teal-800",
    iconBg: "bg-[#0D9488]",
  },
} as const;

interface KpiCardProps {
  label: string;
  value: number;
  tone: keyof typeof KPI_STYLES;
}

function KpiCard({ label, value, tone }: KpiCardProps) {
  const style = KPI_STYLES[tone];

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
          <CalendarDays className="w-4 h-4" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <p className={cn("text-[28px] font-extrabold leading-none", style.text)}>
        {value}
      </p>
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
// Page Button Component
// ============================================

function PageBtn({
  children,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "min-w-[30px] h-7 px-2 rounded-md text-[12px] font-semibold border",
        active
          ? "bg-emerald-600 text-white border-emerald-600"
          : "bg-white border-slate-200 text-[#0B2545] hover:bg-slate-50 cursor-pointer",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}

// ============================================
// Status Badge Component
// ============================================

function StatusBadge({ status }: { status: string }) {
  const styles = {
    present: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    absent: "bg-red-50 text-red-700 ring-red-100",
    late: "bg-amber-50 text-amber-700 ring-amber-100",
    "on-time": "bg-teal-50 text-teal-700 ring-teal-100",
  };

  const defaultStyle = "bg-slate-50 text-slate-700 ring-slate-100";
  const statusKey = status.toLowerCase() as keyof typeof styles;
  const className = styles[statusKey] || defaultStyle;

  return (
    <span
      className={cn(
        "inline-block px-2 py-1 rounded-md text-[11px] font-bold ring-1",
        className,
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ============================================
// Main Component
// ============================================

export function History() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<HistoryRange>("week");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [hasPrev, setHasPrev] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [perPage] = useState<number>(15); // Fixed to match backend
  const [summary, setSummary] = useState<HistoryStats>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    onTime: 0,
  });
  // Track if summary has been loaded once
  const [summaryLoaded, setSummaryLoaded] = useState<boolean>(false);

  // Load history from server
  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response: HistoryResponse = await fetchMyAttendanceHistory(
        currentPage,
        range,
      );

      setRecords(response.data ?? []);
      setTotalItems(response.meta?.total_items ?? 0);
      setTotalPages(response.meta?.total_pages ?? 1);
      setHasNext(response.meta?.has_next ?? false);
      setHasPrev(response.meta?.has_prev ?? false);

      // 💡 Only set summary on first load or when range changes
      if (!summaryLoaded || range) {
        if (response.meta?.summary) {
          setSummary({
            total: response.meta.summary.total || 0,
            present: response.meta.summary.present || 0,
            absent: response.meta.summary.absent || 0,
            late: response.meta.summary.late || 0,
            onTime: response.meta.summary.onTime || 0,
          });
          setSummaryLoaded(true);
        }
      }
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        setError(
          "History endpoint is not available yet. Once your backend exposes GET /attendance/me, records will appear here.",
        );
      } else if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message || "Could not load attendance history.",
        );
      } else {
        setError("Could not load attendance history.");
      }
      setRecords([]);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setLoading(false);
    }
  }, [currentPage, range, summaryLoaded]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Reset to page 1 when range changes
  useEffect(() => {
    setCurrentPage(1);
    setSummaryLoaded(false); // Reset summary to reload on range change
  }, [range]);

  // Filter records client-side (search and status)
  const filtered = useMemo(() => {
    return records.filter((record) => {
      // Status filter
      if (
        statusFilter &&
        record.status?.toLowerCase() !== statusFilter.toLowerCase()
      ) {
        return false;
      }

      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const dateStr = record.date
          ? new Date(record.date).toLocaleDateString()
          : "";
        const location =
          record.clock_in_location || record.clock_out_location || "";

        if (
          !dateStr.includes(q) &&
          !location.toLowerCase().includes(q) &&
          !record.status?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [records, search, statusFilter]);

  // Calculate display range
  const from = records.length ? (currentPage - 1) * perPage + 1 : 0;
  const to = Math.min(currentPage * perPage, totalItems);

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of visible range
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust to always show 3 pages in the middle
      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push("...");
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  // Format functions
  const formatTime = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDateLabel = (iso: string) => {
    return new Date(iso).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const durationLabel = (minutes: number | null) => {
    if (minutes == null) return "—";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <DashboardLayout
      menuOpen={menuOpen}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onLogout={handleLogout}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* KPI Cards - Static once loaded */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <KpiCard label="Total Days" value={summary.total} tone="total" />
          <KpiCard label="Present" value={summary.present} tone="present" />
          <KpiCard label="Absent" value={summary.absent} tone="absent" />
          <KpiCard label="Late" value={summary.late} tone="late" />
          <KpiCard label="On Time" value={summary.onTime} tone="onTime" />
        </section>

        {/* History Table */}
        <section className="bg-white rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
            <h2 className="text-[14px] font-bold uppercase tracking-wide text-[#0B2545]">
              Attendance History ({range.toUpperCase()})
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500">
                {totalItems} records
              </span>
              <Button
                type="button"
                onClick={() => {
                  setSummaryLoaded(false);
                  loadHistory();
                }}
                className="h-8 bg-white px-3 text-[#0B2545] ring-1 ring-slate-200 hover:bg-slate-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 p-3 border-b border-slate-200 bg-slate-50/50">
            {/* Range Filter */}
            <FilterSelect
              value={range}
              onChange={(v) => {
                setRange(v as HistoryRange);
              }}
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </FilterSelect>

            {/* Status Filter */}
            <FilterSelect
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
              }}
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </FilterSelect>

            <div className="relative flex-1 min-w-[200px] ml-auto">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                placeholder="Search by date or location"
                className="w-full pl-8 pr-3 py-2 text-[12.5px] rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
            </div>
          ) : error ? (
            <div className="m-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <CalendarDays className="h-4 w-4" />
                History not connected yet
              </div>
              <p>{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No attendance records match these filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-[12.5px] min-w-[900px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50/40">
                      <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
                        S/N
                      </th>
                      <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        Date
                      </th>
                      <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        Status
                      </th>
                      <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        Punctuality
                      </th>
                      <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        Time In
                      </th>
                      <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        Time Out
                      </th>
                      <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        Duration
                      </th>
                      <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        In Location
                      </th>
                      <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        Out Location
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((record, index) => {
                      const globalIndex =
                        (currentPage - 1) * perPage + index + 1;
                      const dateSource = record.time_in ?? record.date;

                      return (
                        <tr
                          key={record.log_id || index}
                          className="border-t border-slate-100 hover:bg-slate-50/70"
                        >
                          <td className="px-4 py-2.5 font-mono text-slate-500 font-semibold whitespace-nowrap">
                            {globalIndex}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-[#0B2545] whitespace-nowrap">
                            {dateSource ? formatDateLabel(dateSource) : "—"}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <StatusBadge status={record.status || "unknown"} />
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {record.punctuality ? (
                              <StatusBadge status={record.punctuality} />
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 font-mono text-xs whitespace-nowrap">
                            {formatTime(record.time_in)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 font-mono text-xs whitespace-nowrap">
                            {formatTime(record.time_out)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                            {durationLabel(record.duration_minutes || null)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate max-w-[100px]">
                                {record.clock_in_location || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate max-w-[100px]">
                                {record.clock_out_location || "—"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 text-[12px]">
                <div className="text-slate-500">
                  Showing {from} to {to} of {totalItems} records
                </div>

                <div className="flex items-center gap-1">
                  {/* Previous */}
                  <PageBtn
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPrev || loading}
                  >
                    ‹
                  </PageBtn>

                  {/* Page Numbers */}
                  {getPageNumbers().map((page, index) => (
                    <span key={index} className="flex items-center">
                      {page === "..." ? (
                        <span className="px-1 text-slate-400">…</span>
                      ) : (
                        <PageBtn
                          active={page === currentPage}
                          onClick={() => handlePageChange(page as number)}
                        >
                          {page}
                        </PageBtn>
                      )}
                    </span>
                  ))}

                  {/* Next */}
                  <PageBtn
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNext || loading}
                  >
                    ›
                  </PageBtn>
                </div>

                <div className="text-slate-500 text-[11px]">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default History;
