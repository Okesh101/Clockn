// src/components/AttendanceTable.tsx

import { useState, useMemo, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import type {
  AttendanceRange,
  TeacherAttendanceRow,
} from "../types/attendance";

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMethod(method: string | null) {
  if (!method) return "—";
  return method === "qr" ? "QR" : "App";
}

function statusBadge(status: string) {
  if (status === "absent") {
    return {
      label: "Absent",
      bg: "bg-red-50",
      fg: "text-red-700",
      ring: "ring-red-100",
    };
  }
  return {
    label: "Present",
    bg: "bg-emerald-50",
    fg: "text-emerald-800",
    ring: "ring-emerald-100",
  };
}

function punctualityBadge(punctuality: string | null) {
  if (!punctuality)
    return {
      label: "—",
      bg: "bg-gray-50",
      fg: "text-gray-600",
      ring: "ring-gray-100",
    };
  if (punctuality === "late") {
    return {
      label: "Late",
      bg: "bg-amber-50",
      fg: "text-amber-800",
      ring: "ring-amber-100",
    };
  }
  return {
    label: "On Time",
    bg: "bg-blue-50",
    fg: "text-blue-700",
    ring: "ring-blue-100",
  };
}

interface AttendanceTableProps {
  rows: TeacherAttendanceRow[];
  range: AttendanceRange;
  startDate?: string;
  endDate?: string;
  page: number;
  perPage?: number;
  title?: string;
}

export function AttendanceTable({
  rows,
  range,
  startDate,
  endDate,
  page: serverPage,
  perPage = 50,
  title = "Attendance Records",
}: AttendanceTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [punctualityFilter, setPunctualityFilter] = useState<string>("");
  const [rpp, setRpp] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, punctualityFilter]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const record = row.attendance_record;

      // Status filter
      if (statusFilter && record.presence_status !== statusFilter) return false;

      // Punctuality filter
      if (punctualityFilter) {
        if (
          punctualityFilter === "on-time" &&
          record.punctuality_status !== "on-time"
        )
          return false;
        if (
          punctualityFilter === "late" &&
          record.punctuality_status !== "late"
        )
          return false;
      }

      // Search filter
      if (search) {
        const q = search.toLowerCase();
        if (
          !row.teacher_name.toLowerCase().includes(q) &&
          !row.email.toLowerCase().includes(q) &&
          !row.phone.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [rows, search, statusFilter, punctualityFilter]);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / rpp));
  const pg = Math.min(currentPage, totalPages);
  const slice = filtered.slice((pg - 1) * rpp, (pg - 1) * rpp + rpp);
  const from = filtered.length ? (pg - 1) * rpp + 1 : 0;
  const to = Math.min(pg * rpp, filtered.length);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, pg - 1);
      let end = Math.min(totalPages - 1, pg + 1);

      if (pg <= 3) {
        start = 2;
        end = 4;
      } else if (pg >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No attendance records for this range.
      </div>
    );
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
        <h2 className="text-[14px] font-bold uppercase tracking-wide text-[#0B2545]">
          {title} ({getDynamicRangeLabel(range, startDate, endDate)})
        </h2>
        <span className="text-[11px] text-slate-500">
          {filtered.length} records
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-slate-200 bg-slate-50/50">
        <FilterSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </FilterSelect>

        <FilterSelect
          value={punctualityFilter}
          onChange={(v) => {
            setPunctualityFilter(v);
            setCurrentPage(1);
          }}
        >
          <option value="">All Punctuality</option>
          <option value="on-time">On Time</option>
          <option value="late">Late</option>
        </FilterSelect>

        <div className="relative flex-1 min-w-[220px] ml-auto">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, email or phone"
            title="Search attendance"
            className="w-full pl-8 pr-3 py-2 text-[12.5px] rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px] min-w-[1100px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50/40">
              <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                SN
              </th>
              <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                Name
              </th>
              <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                Email
              </th>
              <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                Phone
              </th>
              <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                Time In
              </th>
              <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                Time In Method
              </th>
              <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                Time Out
              </th>
              <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                Time Out Method
              </th>
              <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                Status
              </th>
              <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                Punctuality
              </th>
              <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                Time Spent
              </th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center py-8 text-slate-500">
                  No attendance records match these filters.
                </td>
              </tr>
            )}
            {slice.map((row, index) => {
              const record = row.attendance_record;
              const status = statusBadge(record.presence_status);
              const punctuality = punctualityBadge(record.punctuality_status);
              const globalIndex =
                (serverPage - 1) * perPage + (pg - 1) * rpp + index + 1;

              return (
                <tr
                  key={`${row.teacher_id}-${index}`}
                  className="border-t border-slate-100 hover:bg-slate-50/70"
                >
                  <td className="px-4 py-2.5 font-mono text-slate-500 font-semibold whitespace-nowrap">
                    {globalIndex}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-[#0B2545] whitespace-nowrap">
                    {row.teacher_name}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 truncate max-w-[150px]">
                    {row.email}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                    {row.phone}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 tabular-nums whitespace-nowrap">
                    {formatTime(record.time_in)}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">
                    {formatMethod(record.time_in_method)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                    {formatTime(record.time_out)}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">
                    {formatMethod(record.time_out_method)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-1 rounded-md text-[11px] font-bold ${status.bg} ${status.fg} ring-1 ${status.ring}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-1 rounded-md text-[11px] font-bold ${punctuality.bg} ${punctuality.fg} ring-1 ${punctuality.ring}`}
                    >
                      {punctuality.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                    {record.duration_spent ?? "—"}
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
          Showing {from} to {to} of {filtered.length} records
          {serverPage > 1 && ` (Page ${serverPage} from server)`}
        </div>
        <div className="flex items-center gap-1">
          {/* Previous */}
          <PageBtn
            onClick={() => handlePageChange(Math.max(1, pg - 1))}
            disabled={pg === 1}
          >
            ‹
          </PageBtn>

          {/* Page Numbers with Ellipsis */}
          {getPageNumbers().map((page, index) => (
            <span key={index} className="flex items-center">
              {page === "..." ? (
                <span className="px-1 text-slate-400">…</span>
              ) : (
                <PageBtn
                  active={page === pg}
                  onClick={() => handlePageChange(page as number)}
                >
                  {page}
                </PageBtn>
              )}
            </span>
          ))}

          {/* Next */}
          <PageBtn
            onClick={() => handlePageChange(Math.min(totalPages, pg + 1))}
            disabled={pg === totalPages}
          >
            ›
          </PageBtn>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          Rows per page:
          <select
            value={rpp}
            onChange={(e) => {
              setRpp(+e.target.value);
              setCurrentPage(1);
            }}
            className="border border-slate-200 rounded-md px-2 py-1 bg-white cursor-pointer"
          >
            <option>8</option>
            <option>10</option>
            <option>20</option>
          </select>
        </div>
      </div>
    </section>
  );
}

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

export function getDynamicRangeLabel(
  rng: AttendanceRange,
  filterStartDate?: string,
  filterEndDate?: string,
): string {
  const now = new Date();

  const currentMonthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(now);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
      date,
    );

  const formatDateWithYear = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const currentDayOfWeek = now.getDay();

  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const mondayDate = new Date(now);
  mondayDate.setDate(now.getDate() + distanceToMonday);

  let endDate = new Date(now);
  if (currentDayOfWeek === 0 || currentDayOfWeek === 6) {
    endDate = new Date(mondayDate);
    endDate.setDate(mondayDate.getDate() + 4);
  }

  let weekLabel = "";
  if (now.toDateString() === mondayDate.toDateString()) {
    weekLabel = `${formatDate(mondayDate)}`;
  } else {
    weekLabel = `${formatDate(mondayDate)} - ${formatDate(endDate)}`;
  }

  const rangeLabels: Record<AttendanceRange, string> = {
    today: "Today",
    yesterday: "Yesterday",
    week: weekLabel,
    month: currentMonthName,
    custom:
      filterStartDate && filterEndDate
        ? `${formatDateWithYear(filterStartDate)} - ${formatDateWithYear(filterEndDate)}`
        : "Custom Range",
  };

  return rangeLabels[rng];
}
