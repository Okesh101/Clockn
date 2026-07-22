// // src/pages/Dashboard.tsx

// import { useCallback, useEffect, useState } from "react";
// import { AxiosError } from "axios";
// import { Loader2, UserCheck, AlertCircle, ArrowRight } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// import { DashboardClockBar } from "../components/DashboardClockBar";
// import { DateRangeFilter } from "../components/DateRangeFilter";
// import { AdminLayout } from "../components/dashboard/AdminLayout";
// import { KpiCard } from "../components/KpiCard";
// import { Button } from "../components/ui/form";
// import { useAuth } from "../contexts/AuthContext";
// import { useTimeGreeting } from "../hooks/useTimeGreeting";
// import {
//   fetchAttendanceLogs,
//   fetchAttendanceStats,
// } from "../services/attendanceApi";
// import type {
//   AttendanceRange,
//   AttendanceStats,
//   TeacherAttendanceRow,
// } from "../types/attendance";

// // ============================================
// // Helper Functions
// // ============================================

// function formatTime(iso: string | null) {
//   if (!iso) return "—";
//   return new Date(iso).toLocaleTimeString([], {
//     hour: "numeric",
//     minute: "2-digit",
//   });
// }

// function statusBadge(status: string) {
//   if (status === "absent") {
//     return {
//       label: "Absent",
//       bg: "bg-red-50",
//       fg: "text-red-700",
//       ring: "ring-red-100",
//     };
//   }
//   return {
//     label: "Present",
//     bg: "bg-emerald-50",
//     fg: "text-emerald-800",
//     ring: "ring-emerald-100",
//   };
// }

// function punctualityBadge(punctuality: string | null) {
//   if (!punctuality)
//     return {
//       label: "—",
//       bg: "bg-gray-50",
//       fg: "text-gray-600",
//       ring: "ring-gray-100",
//     };
//   if (punctuality === "late") {
//     return {
//       label: "Late",
//       bg: "bg-amber-50",
//       fg: "text-amber-800",
//       ring: "ring-amber-100",
//     };
//   }
//   return {
//     label: "On Time",
//     bg: "bg-blue-50",
//     fg: "text-blue-700",
//     ring: "ring-blue-100",
//   };
// }

// // ============================================
// // Main Component
// // ============================================

// export function Dashboard() {
//   const { admin, logout } = useAuth();
//   const { greeting } = useTimeGreeting();
//   const navigate = useNavigate();
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [range, setRange] = useState<AttendanceRange>("today");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [page, setPage] = useState(1);
//   const [stats, setStats] = useState<AttendanceStats | null>(null);
//   const [rows, setRows] = useState<TeacherAttendanceRow[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const dateParams =
//     range === "custom" && startDate && endDate
//       ? { start_date: startDate, end_date: endDate }
//       : undefined;

//   const loadData = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const [statsRes, logsRes] = await Promise.all([
//         fetchAttendanceStats(range, dateParams),
//         fetchAttendanceLogs(page, range, dateParams),
//       ]);
//       setStats(statsRes.data ?? null);
//       setRows(logsRes.data ?? []);
//     } catch (err) {
//       if (err instanceof AxiosError) {
//         setError(
//           err.response?.data?.message || "Failed to load dashboard data.",
//         );
//       } else {
//         setError("Failed to load dashboard data.");
//       }
//       setStats(null);
//       setRows([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [range, page, startDate, endDate]);

//   useEffect(() => {
//     if (range === "custom" && (!startDate || !endDate)) return;
//     loadData();
//   }, [loadData, range, startDate, endDate]);

//   const handleLogout = async () => {
//     await logout();
//     navigate("/auth", { replace: true });
//   };

//   const adminName = admin
//     ? `${admin.firstname} ${admin.lastname}`.trim()
//     : "Admin User";

//   const getRangeLabel = (base: string) => {
//     if (range === "today") return `${base} Today`;
//     if (range === "yesterday") return `${base} Yesterday`;
//     if (range === "week") return `${base} This Week`;
//     if (range === "month") return `${base} This Month`;
//     return `${base} This Period`;
//   };

//   // Get first 5 rows for the dashboard table
//   const displayRows = rows.slice(0, 5);
//   const hasMoreRows = rows.length > 5;

//   return (
//     <AdminLayout
//       menuOpen={menuOpen}
//       onMenuOpen={() => setMenuOpen(true)}
//       onMenuClose={() => setMenuOpen(false)}
//       onLogout={handleLogout}
//       headerExtra={
//         <>
//           <DashboardClockBar />
//           <DateRangeFilter
//             value={range}
//             onChange={(value) => {
//               setPage(1);
//               setRange(value);
//             }}
//             startDate={startDate}
//             endDate={endDate}
//             onStartDateChange={setStartDate}
//             onEndDateChange={setEndDate}
//           />
//         </>
//       }
//     >
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <section className="mb-6">
//           <p className="text-sm font-medium text-slate-600">{greeting},</p>
//           <h2 className="text-2xl font-bold text-[#0B2545] sm:text-3xl">
//             {adminName}
//           </h2>
//         </section>

//         {loading ? (
//           <div className="flex items-center justify-center py-20">
//             <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
//           </div>
//         ) : error ? (
//           <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
//             {error}
//           </div>
//         ) : (
//           <>
//             {/* Main KPI Cards */}
//             <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
//               <KpiCard
//                 label="Total Teachers"
//                 value={stats?.total_teachers ?? 0}
//                 tone="teachers"
//               />
//               <KpiCard
//                 label={getRangeLabel("Present")}
//                 value={stats?.total_present ?? 0}
//                 tone="present"
//               />
//               <KpiCard
//                 label={getRangeLabel("Late")}
//                 value={stats?.total_late ?? 0}
//                 tone="late"
//               />
//               <KpiCard
//                 label={getRangeLabel("Absent")}
//                 value={stats?.total_absent ?? 0}
//                 tone="absent"
//               />
//               <KpiCard
//                 label={getRangeLabel("On Time")}
//                 value={stats?.total_on_time ?? 0}
//                 tone="ontime"
//               />
//             </section>

//             {/* Today's Snapshot - Only show when range is 'today' */}
//             {range === "today" && stats?.snapshot_today && (
//               <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4 mt-4">
//                 <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col hover:shadow-sm transition-shadow bg-emerald-50">
//                   <div className="flex items-center gap-2 mb-2">
//                     <span className="w-7 h-7 rounded-full grid place-items-center shrink-0 bg-[#16A34A] text-white">
//                       <UserCheck className="w-4 h-4" />
//                     </span>
//                     <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
//                       Present Today
//                     </span>
//                   </div>
//                   <p className="text-[28px] font-extrabold leading-none text-emerald-800">
//                     {stats.snapshot_today.present}
//                   </p>
//                 </div>
//                 <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col hover:shadow-sm transition-shadow bg-red-50">
//                   <div className="flex items-center gap-2 mb-2">
//                     <span className="w-7 h-7 rounded-full grid place-items-center shrink-0 bg-[#DC2626] text-white">
//                       <AlertCircle className="w-4 h-4" />
//                     </span>
//                     <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
//                       Absent Today
//                     </span>
//                   </div>
//                   <p className="text-[28px] font-extrabold leading-none text-red-800">
//                     {stats.snapshot_today.absent}
//                   </p>
//                 </div>
//               </section>
//             )}

//             {/* Attendance Logs Table - Simplified */}
//             <section className="mt-8">
//               <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
//                 <h3 className="text-lg font-bold text-[#0B2545]">
//                   Recent Attendance Logs
//                 </h3>
//                 <Button
//                   type="button"
//                   onClick={() => navigate("/attendance-logs")}
//                   className="h-9 bg-[#0B2545] px-4 text-white hover:bg-[#1a3a5c]"
//                 >
//                   View All Logs
//                   <ArrowRight className="h-4 w-4 ml-2" />
//                 </Button>
//               </div>

//               {rows.length === 0 ? (
//                 <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
//                   No attendance records for this range.
//                 </div>
//               ) : (
//                 <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
//                   <div className="overflow-x-auto">
//                     <table className="w-full text-[12.5px]">
//                       <thead>
//                         <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50/40">
//                           <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
//                             Name
//                           </th>
//                           <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
//                             Time In
//                           </th>
//                           <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
//                             Time Out
//                           </th>
//                           <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
//                             Status
//                           </th>
//                           <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
//                             Punctuality
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {displayRows.map((row, index) => {
//                           const record = row.attendance_record;
//                           const status = statusBadge(record.presence_status);
//                           const punctuality = punctualityBadge(
//                             record.punctuality_status,
//                           );

//                           return (
//                             <tr
//                               key={`${row.teacher_id}-${index}`}
//                               className="border-t border-slate-100 hover:bg-slate-50/70"
//                             >
//                               <td className="px-4 py-2.5 font-semibold text-[#0B2545] whitespace-nowrap">
//                                 {row.teacher_name}
//                               </td>
//                               <td className="px-3 py-2.5 text-slate-600 tabular-nums whitespace-nowrap">
//                                 {formatTime(record.time_in)}
//                               </td>
//                               <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
//                                 {formatTime(record.time_out)}
//                               </td>
//                               <td className="px-3 py-2.5 whitespace-nowrap">
//                                 <span
//                                   className={`inline-block px-2 py-1 rounded-md text-[11px] font-bold ${status.bg} ${status.fg} ring-1 ${status.ring}`}
//                                 >
//                                   {status.label}
//                                 </span>
//                               </td>
//                               <td className="px-3 py-2.5 whitespace-nowrap">
//                                 <span
//                                   className={`inline-block px-2 py-1 rounded-md text-[11px] font-bold ${punctuality.bg} ${punctuality.fg} ring-1 ${punctuality.ring}`}
//                                 >
//                                   {punctuality.label}
//                                 </span>
//                               </td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>
//                     </table>
//                   </div>

//                   {/* View All Footer */}
//                   {hasMoreRows && (
//                     <div className="flex justify-center px-4 py-3 border-t border-slate-200">
//                       <button
//                         onClick={() => navigate("/attendance-logs")}
//                         className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B2545] hover:text-[#1a3a5c] transition-colors"
//                       >
//                         View all {rows.length} logs
//                         <ArrowRight className="h-4 w-4" />
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </section>
//           </>
//         )}
//       </div>
//     </AdminLayout>
//   );
// }

// export default Dashboard;

// src/pages/Dashboard.tsx
import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  Loader2,
  UserCheck,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { DashboardClockBar } from "../components/DashboardClockBar";
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
import { fetchWeeklyCharts, type WeeklyChartData } from "../services/chartsApi";
import type {
  AttendanceRange,
  AttendanceStats,
  TeacherAttendanceRow,
} from "../types/attendance";

// ============================================
// Helper Functions
// ============================================

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
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

// ============================================
// Chart Components
// ============================================

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-[#0B2545]">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const COLORS = {
  present: "#16A34A",
  onTime: "#0D9488",
  late: "#D97706",
};

// ============================================
// Main Component
// ============================================

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<WeeklyChartData[]>([]);
  const [totalTeachersLimit, setTotalTeachersLimit] = useState(0);
  const [chartLoading, setChartLoading] = useState(true);

  const dateParams =
    range === "custom" && startDate && endDate
      ? { start_date: startDate, end_date: endDate }
      : undefined;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, logsRes, chartsRes] = await Promise.all([
        fetchAttendanceStats(range, dateParams),
        fetchAttendanceLogs(page, range, dateParams),
        fetchWeeklyCharts(),
      ]);
      setStats(statsRes.data ?? null);
      setRows(logsRes.data ?? []);
      setChartData(chartsRes.data ?? []);
      setTotalTeachersLimit(chartsRes.meta?.total_teachers_limit ?? 0);
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
      setChartLoading(false);
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

  // Get first 5 rows for the dashboard table
  const displayRows = rows.slice(0, 5);
  const hasMoreRows = rows.length > 5;

  // Format chart data for the present chart
  const presentChartData = chartData.map((item) => ({
    day: item.day,
    present: item.present,
  }));

  // Format chart data for the punctuality chart
  const punctualityChartData = chartData.map((item) => ({
    day: item.day,
    "On Time": item.on_time,
    Late: item.late,
  }));

  // Get week range label
  const getWeekLabel = () => {
    if (chartData.length === 0) return "This Week";
    const firstDate = new Date(chartData[0].date);
    const lastDate = new Date(chartData[chartData.length - 1].date);
    const start = firstDate.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
    const end = lastDate.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
    return `${start} - ${end}`;
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
            {/* Main KPI Cards - Removed Absent and On Time since they're already in the main cards */}
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

            {/* Charts Section - 2 Column Grid */}
            <section className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0B2545] flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Weekly Attendance Overview
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    ({getWeekLabel()})
                  </span>
                </h3>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Max: {totalTeachersLimit} teachers
                </div>
              </div>

              {chartLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-6 h-[300px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-6 h-[300px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
                  </div>
                </div>
              ) : chartData.length === 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-6 h-[300px] flex items-center justify-center text-slate-500">
                    No data available for this week
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-6 h-[300px] flex items-center justify-center text-slate-500">
                    No data available for this week
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Chart 1: Present per Day */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
                    <h4 className="text-sm font-semibold text-[#0B2545] mb-2">
                      Present Teachers Per Day
                    </h4>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={presentChartData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />
                          <XAxis
                            dataKey="day"
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            axisLine={{ stroke: "#e2e8f0" }}
                          />
                          <YAxis
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            axisLine={{ stroke: "#e2e8f0" }}
                            domain={[0, Math.max(totalTeachersLimit, 10)]}
                            tickCount={Math.min(totalTeachersLimit + 1, 8)}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="present"
                            fill={COLORS.present}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={60}
                          >
                            {presentChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.present > 0 ? COLORS.present : "#e2e8f0"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-slate-400 text-center mt-1">
                      Showing number of teachers present each day this week
                    </p>
                  </div>

                  {/* Chart 2: On Time vs Late per Day */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
                    <h4 className="text-sm font-semibold text-[#0B2545] mb-2">
                      Punctuality Breakdown: On Time vs Late
                    </h4>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={punctualityChartData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />
                          <XAxis
                            dataKey="day"
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            axisLine={{ stroke: "#e2e8f0" }}
                          />
                          <YAxis
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            axisLine={{ stroke: "#e2e8f0" }}
                            domain={[0, Math.max(totalTeachersLimit, 10)]}
                            tickCount={Math.min(totalTeachersLimit + 1, 8)}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend
                            wrapperStyle={{
                              fontSize: "12px",
                              paddingTop: "8px",
                            }}
                          />
                          <Bar
                            dataKey="On Time"
                            fill={COLORS.onTime}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={30}
                          />
                          <Bar
                            dataKey="Late"
                            fill={COLORS.late}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={30}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-slate-400 text-center mt-1">
                      Comparing on-time vs late arrivals per day
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Attendance Logs Table - Simplified */}
            <section className="mt-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-[#0B2545]">
                  Recent Attendance Logs
                </h3>
                <Button
                  type="button"
                  onClick={() => navigate("/attendance-logs")}
                  className="h-9 bg-[#0B2545] px-4 text-white hover:bg-[#1a3a5c]"
                >
                  View All Logs
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {rows.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                  No attendance records for this range.
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12.5px]">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50/40">
                          <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
                            Name
                          </th>
                          <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                            Time In
                          </th>
                          <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                            Time Out
                          </th>
                          <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                            Status
                          </th>
                          <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                            Punctuality
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayRows.map((row, index) => {
                          const record = row.attendance_record;
                          const status = statusBadge(record.presence_status);
                          const punctuality = punctualityBadge(
                            record.punctuality_status,
                          );

                          return (
                            <tr
                              key={`${row.teacher_id}-${index}`}
                              className="border-t border-slate-100 hover:bg-slate-50/70"
                            >
                              <td className="px-4 py-2.5 font-semibold text-[#0B2545] whitespace-nowrap">
                                {row.teacher_name}
                              </td>
                              <td className="px-3 py-2.5 text-slate-600 tabular-nums whitespace-nowrap">
                                {formatTime(record.time_in)}
                              </td>
                              <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                                {formatTime(record.time_out)}
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
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* View All Footer */}
                  {hasMoreRows && (
                    <div className="flex justify-center px-4 py-3 border-t border-slate-200">
                      <button
                        onClick={() => navigate("/attendance-logs")}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B2545] hover:text-[#1a3a5c] transition-colors"
                      >
                        View all {rows.length} logs
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
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
