// // src/pages/MyRequests.tsx
// import { useCallback, useEffect, useState } from "react";
// import { AxiosError } from "axios";
// import {
//   Loader2,
//   RefreshCw,
//   ChevronDown,
//   Clock,
//   CheckCircle2,
//   XCircle,
//   AlertCircle,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// import { DashboardLayout } from "../components/dashboard/DashboardLayout";
// import { Button } from "../components/ui/Button";
// import { useAuth } from "../contexts/AuthContext";
// import {
//   fetchMyRequests,
//   type AttendanceRequest,
// } from "../services/requestApi";
// import { cn } from "../lib/utils";

// // ============================================
// // Components
// // ============================================

// function FilterSelect({
//   value,
//   onChange,
//   children,
// }: {
//   value: string;
//   onChange: (v: string) => void;
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="relative">
//       <select
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-[12.5px] cursor-pointer"
//       >
//         {children}
//       </select>
//       <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
//     </div>
//   );
// }

// function StatusBadge({ status }: { status: string }) {
//   const styles = {
//     pending: {
//       bg: "bg-amber-50",
//       text: "text-amber-700",
//       ring: "ring-amber-100",
//       icon: Clock,
//     },
//     approved: {
//       bg: "bg-emerald-50",
//       text: "text-emerald-700",
//       ring: "ring-emerald-100",
//       icon: CheckCircle2,
//     },
//     rejected: {
//       bg: "bg-red-50",
//       text: "text-red-700",
//       ring: "ring-red-100",
//       icon: XCircle,
//     },
//   };

//   const style = styles[status as keyof typeof styles] || styles.pending;
//   const Icon = style.icon;

//   return (
//     <span
//       className={cn(
//         "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1",
//         style.bg,
//         style.text,
//         style.ring,
//       )}
//     >
//       <Icon className="w-3.5 h-3.5" />
//       {status.charAt(0).toUpperCase() + status.slice(1)}
//     </span>
//   );
// }

// function RequestCard({ request }: { request: AttendanceRequest }) {
//   const date = new Date(request.created_at);
//   const formattedDate = date.toLocaleDateString([], {
//     weekday: "short",
//     month: "short",
//     day: "numeric",
//     year: "numeric",
//   });
//   const formattedTime = date.toLocaleTimeString([], {
//     hour: "2-digit",
//     minute: "2-digit",
//   });

//   return (
//     <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
//       <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
//         <div className="min-w-0">
//           <div className="flex items-center gap-2 flex-wrap">
//             <StatusBadge status={request.status} />
//             <span className="text-xs text-slate-400">
//               {formattedDate} at {formattedTime}
//             </span>
//           </div>
//           {request.teacher_note && (
//             <p className="mt-2 text-sm text-slate-600">
//               <span className="font-medium">Note:</span> {request.teacher_note}
//             </p>
//           )}
//           {request.admin_note && (
//             <p className="mt-1 text-sm text-slate-500 bg-slate-50 rounded-lg p-2">
//               <span className="font-medium">Admin response:</span>{" "}
//               {request.admin_note}
//             </p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ============================================
// // Main Component
// // ============================================

// export function MyRequests() {
//   const { logout } = useAuth();
//   const navigate = useNavigate();
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [requests, setRequests] = useState<AttendanceRequest[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [statusFilter, setStatusFilter] = useState<string>("");
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalItems, setTotalItems] = useState(0);
//   const [hasNext, setHasNext] = useState(false);
//   const [hasPrev, setHasPrev] = useState(false);

//   const loadRequests = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await fetchMyRequests(
//         page,
//         10,
//         statusFilter || undefined,
//       );
//       setRequests(response.data ?? []);
//       setTotalItems(response.meta?.total_items ?? 0);
//       setTotalPages(response.meta?.total_pages ?? 1);
//       setHasNext(response.meta?.has_next ?? false);
//       setHasPrev(response.meta?.has_prev ?? false);
//     } catch (err) {
//       setError(
//         err instanceof AxiosError
//           ? err.response?.data?.message || "Failed to load requests."
//           : "Failed to load requests.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, [page, statusFilter]);

//   useEffect(() => {
//     loadRequests();
//   }, [loadRequests]);

//   const handleLogout = async () => {
//     await logout();
//     navigate("/auth", { replace: true });
//   };

//   const handlePageChange = (newPage: number) => {
//     if (newPage >= 1 && newPage <= totalPages) {
//       setPage(newPage);
//     }
//   };

//   const getPageNumbers = () => {
//     const pages = [];
//     const maxVisible = 5;

//     if (totalPages <= maxVisible) {
//       for (let i = 1; i <= totalPages; i++) {
//         pages.push(i);
//       }
//     } else {
//       pages.push(1);
//       let start = Math.max(2, page - 1);
//       let end = Math.min(totalPages - 1, page + 1);

//       if (page <= 3) {
//         start = 2;
//         end = 4;
//       } else if (page >= totalPages - 2) {
//         start = totalPages - 3;
//         end = totalPages - 1;
//       }

//       if (start > 2) pages.push("...");
//       for (let i = start; i <= end; i++) pages.push(i);
//       if (end < totalPages - 1) pages.push("...");
//       pages.push(totalPages);
//     }
//     return pages;
//   };

//   return (
//     <DashboardLayout
//       menuOpen={menuOpen}
//       onMenuOpen={() => setMenuOpen(true)}
//       onMenuClose={() => setMenuOpen(false)}
//       onLogout={handleLogout}
//     >
//       <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Page Header */}
//         <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//           <div>
//             <h2 className="text-2xl font-bold text-[#0B2545]">My Requests</h2>
//             <p className="mt-1 text-sm text-slate-500">
//               View all your clock-out requests and their status
//             </p>
//           </div>
//           <Button
//             type="button"
//             onClick={loadRequests}
//             className="h-9 bg-white px-3 text-[#0B2545] ring-1 ring-slate-200 hover:bg-slate-50"
//           >
//             <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
//           </Button>
//         </div>

//         {/* Filters */}
//         <div className="mb-6 flex flex-wrap items-center gap-3">
//           <FilterSelect
//             value={statusFilter}
//             onChange={(v) => {
//               setStatusFilter(v);
//               setPage(1);
//             }}
//           >
//             <option value="">All Status</option>
//             <option value="pending">Pending</option>
//             <option value="approved">Approved</option>
//             <option value="rejected">Rejected</option>
//           </FilterSelect>
//           <span className="text-sm text-slate-500">
//             {totalItems} request{totalItems !== 1 ? "s" : ""}
//           </span>
//         </div>

//         {/* Content */}
//         {loading ? (
//           <div className="flex items-center justify-center py-20">
//             <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
//           </div>
//         ) : error ? (
//           <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
//             <div className="flex items-start gap-3">
//               <AlertCircle className="h-5 w-5 mt-0.5 text-red-600" />
//               <div>
//                 <p className="font-semibold">Failed to load requests</p>
//                 <p className="mt-1">{error}</p>
//                 <button
//                   type="button"
//                   onClick={loadRequests}
//                   className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0B2545] ring-1 ring-red-200 hover:bg-red-50 transition-colors"
//                 >
//                   <RefreshCw className="h-4 w-4" />
//                   Try again
//                 </button>
//               </div>
//             </div>
//           </div>
//         ) : requests.length === 0 ? (
//           <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
//             <div className="flex flex-col items-center">
//               <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
//                 <Clock className="w-8 h-8 text-slate-400" />
//               </div>
//               <h3 className="text-lg font-semibold text-[#0B2545]">
//                 No requests yet
//               </h3>
//               <p className="mt-1 text-sm text-slate-500 max-w-sm">
//                 When you request an early clock-out, it will appear here with
//                 the status.
//               </p>
//             </div>
//           </div>
//         ) : (
//           <div className="space-y-3">
//             {requests.map((request) => (
//               <RequestCard key={request.id} request={request} />
//             ))}

//             {/* Pagination */}
//             {totalPages > 1 && (
//               <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
//                 <div className="text-sm text-slate-500">
//                   Showing {requests.length} of {totalItems} requests
//                 </div>
//                 <div className="flex items-center gap-1">
//                   <button
//                     onClick={() => handlePageChange(page - 1)}
//                     disabled={!hasPrev}
//                     className="min-w-[30px] h-7 px-2 rounded-md text-sm font-semibold border border-slate-200 bg-white text-[#0B2545] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
//                   >
//                     ‹
//                   </button>
//                   {getPageNumbers().map((p, idx) => (
//                     <span key={idx} className="flex items-center">
//                       {p === "..." ? (
//                         <span className="px-1 text-slate-400">…</span>
//                       ) : (
//                         <button
//                           onClick={() => handlePageChange(p as number)}
//                           className={cn(
//                             "min-w-[30px] h-7 px-2 rounded-md text-sm font-semibold border",
//                             p === page
//                               ? "bg-emerald-600 text-white border-emerald-600"
//                               : "border-slate-200 bg-white text-[#0B2545] hover:bg-slate-50",
//                           )}
//                         >
//                           {p}
//                         </button>
//                       )}
//                     </span>
//                   ))}
//                   <button
//                     onClick={() => handlePageChange(page + 1)}
//                     disabled={!hasNext}
//                     className="min-w-[30px] h-7 px-2 rounded-md text-sm font-semibold border border-slate-200 bg-white text-[#0B2545] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
//                   >
//                     ›
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </DashboardLayout>
//   );
// }

// export default MyRequests;


// src/pages/MyRequests.tsx
import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  Loader2,
  RefreshCw,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  MessageSquare,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { DashboardLayout } from "../components/dashboard/DashboardLayout";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchMyRequests,
  type AttendanceRequest,
} from "../services/requestApi";
import { cn } from "../lib/utils";

// ============================================
// Components
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

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      ring: "ring-amber-100",
      icon: Clock,
    },
    approved: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      ring: "ring-emerald-100",
      icon: CheckCircle2,
    },
    rejected: {
      bg: "bg-red-50",
      text: "text-red-700",
      ring: "ring-red-100",
      icon: XCircle,
    },
  };

  const style = styles[status as keyof typeof styles] || styles.pending;
  const Icon = style.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1",
        style.bg,
        style.text,
        style.ring,
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function RequestCard({ request }: { request: AttendanceRequest }) {
  const date = new Date(request.created_at);
  const formattedDate = date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const getStatusMessage = () => {
    switch (request.status) {
      case "pending":
        return "Waiting for admin approval...";
      case "approved":
        return "Request approved! You have been clocked out.";
      case "rejected":
        return "Request was declined.";
      default:
        return "";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={request.status} />
            <span className="text-xs text-slate-400">
              {formattedDate} at {formattedTime}
            </span>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {new Date(request.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Note */}
        {request.teacher_note && (
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Your Note</p>
                <p className="text-sm text-[#0B2545]">{request.teacher_note}</p>
              </div>
            </div>
          </div>
        )}

        {/* Admin Response */}
        {request.admin_note && (
          <div className={cn(
            "rounded-lg p-3",
            request.status === "approved" 
              ? "bg-emerald-50" 
              : request.status === "rejected" 
              ? "bg-red-50" 
              : "bg-slate-50"
          )}>
            <div className="flex items-start gap-2">
              <User className={cn(
                "w-4 h-4 mt-0.5 flex-shrink-0",
                request.status === "approved" 
                  ? "text-emerald-600" 
                  : request.status === "rejected" 
                  ? "text-red-600" 
                  : "text-slate-400"
              )} />
              <div>
                <p className="text-xs font-medium text-slate-500">Admin Response</p>
                <p className={cn(
                  "text-sm",
                  request.status === "approved" 
                    ? "text-emerald-700" 
                    : request.status === "rejected" 
                    ? "text-red-700" 
                    : "text-slate-600"
                )}>
                  {request.admin_note}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        <div className="text-xs text-slate-500 italic">
          {getStatusMessage()}
        </div>
      </div>
    </div>
  );
}

// ============================================
// KPI Cards
// ============================================

function KpiCard({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "amber" | "emerald" | "red" }) {
  const styles = {
    default: "bg-slate-50 text-slate-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col hover:shadow-sm transition-shadow">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={cn("text-2xl font-bold mt-1", styles[tone])}>{value}</p>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function MyRequests() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchMyRequests(
        page,
        10,
        statusFilter || undefined,
      );
      setRequests(response.data ?? []);
      setTotalItems(response.meta?.total_items ?? 0);
      setTotalPages(response.meta?.total_pages ?? 1);
      setHasNext(response.meta?.has_next ?? false);
      setHasPrev(response.meta?.has_prev ?? false);
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? err.response?.data?.message || "Failed to load requests."
          : "Failed to load requests.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      if (page <= 3) {
        start = 2;
        end = 4;
      } else if (page >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  // Calculate stats
  const pendingCount = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;

  return (
    <DashboardLayout
      menuOpen={menuOpen}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onLogout={handleLogout}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#0B2545]">My Requests</h2>
            <p className="mt-1 text-sm text-slate-500">
              View all your clock-out requests and their status
            </p>
          </div>
          <Button
            type="button"
            onClick={loadRequests}
            className="h-9 bg-white px-3 text-[#0B2545] ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <KpiCard label="Pending" value={pendingCount} tone="amber" />
          <KpiCard label="Approved" value={approvedCount} tone="emerald" />
          <KpiCard label="Rejected" value={rejectedCount} tone="red" />
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <FilterSelect
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </FilterSelect>
          <span className="text-sm text-slate-500">
            {totalItems} request{totalItems !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 text-red-600" />
              <div>
                <p className="font-semibold">Failed to load requests</p>
                <p className="mt-1">{error}</p>
                <button
                  type="button"
                  onClick={loadRequests}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0B2545] ring-1 ring-red-200 hover:bg-red-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-[#0B2545]">
                No requests yet
              </h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                When you request an early clock-out, it will appear here with
                the status.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="text-sm text-slate-500">
                  Showing {requests.length} of {totalItems} requests
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={!hasPrev}
                    className="min-w-[30px] h-7 px-2 rounded-md text-sm font-semibold border border-slate-200 bg-white text-[#0B2545] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  {getPageNumbers().map((p, idx) => (
                    <span key={idx} className="flex items-center">
                      {p === "..." ? (
                        <span className="px-1 text-slate-400">…</span>
                      ) : (
                        <button
                          onClick={() => handlePageChange(p as number)}
                          className={cn(
                            "min-w-[30px] h-7 px-2 rounded-md text-sm font-semibold border",
                            p === page
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "border-slate-200 bg-white text-[#0B2545] hover:bg-slate-50",
                          )}
                        >
                          {p}
                        </button>
                      )}
                    </span>
                  ))}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!hasNext}
                    className="min-w-[30px] h-7 px-2 rounded-md text-sm font-semibold border border-slate-200 bg-white text-[#0B2545] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default MyRequests;