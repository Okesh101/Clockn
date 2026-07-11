import type { TeacherAttendanceRow } from "../types/attendance";

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

function statusBadge(status: string, punctuality: string | null) {
  if (status === "absent") {
    return { label: "Absent", className: "bg-red-50 text-red-700 ring-red-100" };
  }
  if (punctuality === "late") {
    return { label: "Late", className: "bg-amber-50 text-amber-800 ring-amber-100" };
  }
  return { label: "Present", className: "bg-emerald-50 text-emerald-800 ring-emerald-100" };
}

interface AttendanceTableProps {
  rows: TeacherAttendanceRow[];
  page: number;
  perPage?: number;
}

export function AttendanceTable({ rows, page, perPage = 50 }: AttendanceTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No attendance records for this range.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">S/N</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Time In</th>
              <th className="px-4 py-3">Out</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Method</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => {
              const record = row.attendance_record;
              const badge = statusBadge(
                record.presence_status,
                record.punctuality_status,
              );

              return (
                <tr key={`${row.teacher_id}-${index}`} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 tabular-nums text-slate-500">
                    {(page - 1) * perPage + index + 1}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#0B2545]">
                    {row.teacher_name}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatTime(record.time_in)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatTime(record.time_out)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-600">
                    {formatMethod(record.time_in_method)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
