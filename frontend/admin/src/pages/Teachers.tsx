// src/pages/Teachers.tsx
import { useCallback, useEffect, useState, useMemo } from "react";
import { AxiosError } from "axios";
import {
  Loader2,
  RefreshCw,
  Search,
  ChevronDown,
  Mail,
  Phone,
  User,
  Eye,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AdminLayout } from "../components/dashboard/AdminLayout";
import { Button } from "../components/ui/form";
import { useAuth } from "../contexts/AuthContext";
import { fetchTeachers, type TeacherListItem } from "../services/teachersApi";
import { cn } from "../lib/utils";
import { TeacherDetailModal } from "../components/TeacherDetailModal";

// KPI Cards Component
const styles = {
  total: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    ring: "ring-blue-100",
    iconBg: "bg-[#2563EB]",
  },
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    ring: "ring-emerald-100",
    iconBg: "bg-[#16A34A]",
  },
  inactive: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    ring: "ring-amber-100",
    iconBg: "bg-[#D97706]",
  },
} as const;

const iconMap = {
  total: User,
  active: User,
  inactive: User,
} as const;

interface KpiCardProps {
  label: string;
  value: number | string;
  tone?: keyof typeof styles;
}

function KpiCard({ label, value, tone = "total" }: KpiCardProps) {
  const style = styles[tone];
  const Icon = iconMap[tone];

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
      <p className={cn("text-[28px] font-extrabold leading-none", style.text)}>
        {value}
      </p>
    </div>
  );
}

// Filter Select Component
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

// Page Button Component
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

// Action Types
type TeacherAction = "call" | "email" | "view" | "message";

const ACTION_META: Record<
  TeacherAction,
  { label: string; icon: any; color: string }
> = {
  call: {
    label: "Call",
    icon: Phone,
    color: "text-emerald-700 border-emerald-500/50 hover:bg-emerald-50",
  },
  email: {
    label: "Email",
    icon: Mail,
    color: "text-blue-700 border-blue-500/50 hover:bg-blue-50",
  },
  view: {
    label: "View",
    icon: Eye,
    color: "text-slate-700 border-slate-300 hover:bg-slate-50",
  },
  message: {
    label: "Message",
    icon: MessageSquare,
    color: "text-purple-700 border-purple-500/50 hover:bg-purple-50",
  },
};

interface NextActionButtonProps {
  actions?: TeacherAction[];
  onAction: (action: TeacherAction, teacherId: string) => void;
  teacherId: string;
}

function NextActionButton({
  actions = ["call", "email"],
  onAction,
  teacherId,
}: NextActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const primaryAction = actions[0];
  const primaryMeta = ACTION_META[primaryAction];
  const PrimaryIcon = primaryMeta.icon;

  const handlePrimaryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction(primaryAction, teacherId);
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleActionClick = (e: React.MouseEvent, action: TeacherAction) => {
    e.stopPropagation();
    onAction(action, teacherId);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-flex">
      <button
        onClick={handlePrimaryClick}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-l-md text-[11.5px] font-semibold border",
          "bg-white",
          primaryMeta.color,
        )}
      >
        <PrimaryIcon className="w-3.5 h-3.5" /> {primaryMeta.label}
      </button>

      {actions.length > 1 && (
        <>
          <button
            onClick={handleDropdownClick}
            className={cn(
              "px-1.5 py-1.5 rounded-r-md border border-l-0",
              "bg-white",
              primaryMeta.color,
            )}
          >
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform",
                isOpen && "rotate-180",
              )}
            />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
              {actions.slice(1).map((action) => {
                const meta = ACTION_META[action];
                const Icon = meta.icon;
                return (
                  <button
                    key={action}
                    onClick={(e) => handleActionClick(e, action)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] hover:bg-slate-50 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-slate-500" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Main Teachers Component
export function Teachers() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [serverPage, setServerPage] = useState(1); // Server-side page
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [rpp, setRpp] = useState(10);
  const [currentPage, setCurrentPage] = useState(1); // Client-side page
  const [selectedTeacher, setSelectedTeacher] =
    useState<TeacherListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load teachers from server with server-side pagination
  const loadTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchTeachers(serverPage);
      setTeachers(response.data ?? []);
      setHasNext(response.meta?.has_next ?? false);
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? err.response?.data?.message || "Failed to load teachers."
          : "Failed to load teachers.",
      );
    } finally {
      setLoading(false);
    }
  }, [serverPage]);

  // Reload teachers when server page changes
  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  // Reset client page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // Calculate stats for KPI cards
  const stats = useMemo(() => {
    const total = teachers.length;
    return { total };
  }, [teachers]);

  // Filter teachers client-side (search and status)
  const filtered = useMemo(() => {
    return teachers.filter((teacher) => {
      // Status filter (if implemented)
      // if (statusFilter === "active" && teacher.status !== "active") return false;
      // if (statusFilter === "inactive" && teacher.status !== "inactive") return false;

      // Search filter
      if (search) {
        const q = search.toLowerCase();
        if (
          !teacher.name.toLowerCase().includes(q) &&
          !teacher.email.toLowerCase().includes(q) &&
          !teacher.phone?.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [teachers, search, statusFilter]);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / rpp));
  const currentPageNum = Math.min(currentPage, totalPages);
  const startIndex = (currentPageNum - 1) * rpp;
  const endIndex = Math.min(startIndex + rpp, filtered.length);
  const currentData = filtered.slice(startIndex, endIndex);
  const from = filtered.length ? startIndex + 1 : 0;
  const to = endIndex;

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  // Handle server-side pagination (Next/Previous from API)
  const handleServerPageChange = (newPage: number) => {
    if (
      newPage >= 1 &&
      (newPage <= serverPage || hasNext || newPage < serverPage)
    ) {
      setServerPage(newPage);
      setCurrentPage(1); // Reset client page when server page changes
    }
  };

  // Handle teacher actions
  const handleTeacherAction = (action: TeacherAction, teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    switch (action) {
      case "call":
        if (teacher.phone) {
          window.location.href = `tel:${teacher.phone}`;
        } else {
          alert("No phone number available for this teacher.");
        }
        break;

      case "email":
        if (teacher.email) {
          const subject = encodeURIComponent("School Attendance Update");
          const body = encodeURIComponent(
            `Hello ${teacher.name},\n\nI hope this email finds you well.\n\nBest regards,\nSchool Administration`,
          );

          // Check if on mobile
          const isMobile = /Android|iPhone|iPad|iPod/i.test(
            navigator.userAgent,
          );

          if (isMobile) {
            // Try Gmail app on mobile first
            const gmailLink = `googlegmail://co?to=${teacher.email}&subject=${subject}&body=${body}`;
            const mailtoLink = `mailto:${teacher.email}?subject=${subject}&body=${body}`;

            // Try Gmail app, fallback to mailto
            try {
              window.location.href = gmailLink;
              // If Gmail app doesn't open, fallback to mailto after a delay
              setTimeout(() => {
                window.location.href = mailtoLink;
              }, 1000);
            } catch (error) {
              window.location.href = mailtoLink;
            }
          } else {
            // Desktop - use mailto
            const mailtoLink = `mailto:${teacher.email}?subject=${subject}&body=${body}`;
            window.location.href = mailtoLink;
          }
        } else {
          alert("No email address available for this teacher.");
        }
        break;
      case "view":
        setSelectedTeacher(teacher);
        setIsModalOpen(true);
        break;

      case "message":
        alert(`Message to ${teacher.name} (${teacher.email || teacher.phone})`);
        break;

      default:
        break;
    }
  };

  const handleModalAction = (action: string, teacherId: string) => {
    handleTeacherAction(action as TeacherAction, teacherId);
    if (action !== "view") {
      setIsModalOpen(false);
    }
  };

  return (
    <AdminLayout
      title="Teachers"
      menuOpen={menuOpen}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onLogout={handleLogout}
    >
      {/* KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Total Teachers" value={stats.total} tone="total" />
      </section>

      {/* Teachers Table */}
      <section className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
          <h2 className="text-[14px] font-bold uppercase tracking-wide text-[#0B2545]">
            All Teachers
          </h2>
          <span className="text-[11px] text-slate-500">
            {filtered.length} teachers
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
              className="w-full pl-8 pr-3 py-2 text-[12.5px] rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <Button
            type="button"
            onClick={() => loadTeachers()}
            className="h-9 bg-white px-3 text-[#0B2545] ring-1 ring-slate-200"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 m-4 text-sm text-red-800">
            {error}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50/40">
                    <th className="px-4 py-2.5 font-semibold">SN</th>
                    <th className="px-3 py-2.5 font-semibold">Name</th>
                    <th className="px-3 py-2.5 font-semibold">Email</th>
                    <th className="px-3 py-2.5 font-semibold">Phone</th>
                    <th className="px-3 py-2.5 font-semibold">Joined</th>
                    <th className="px-3 py-2.5 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-slate-500"
                      >
                        No teachers match these filters.
                      </td>
                    </tr>
                  )}
                  {currentData.map((teacher, index) => {
                    const globalIndex = startIndex + index + 1;

                    return (
                      <tr
                        key={teacher.id}
                        className="border-t border-slate-100 hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-2.5 font-mono text-slate-500 font-semibold">
                          {globalIndex}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-[#0B2545]">
                          {teacher.name}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {teacher.email}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {teacher.phone || "—"}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {teacher.created_at
                            ? new Date(teacher.created_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <NextActionButton
                            actions={["call", "email", "view"]}
                            onAction={handleTeacherAction}
                            teacherId={teacher.id}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination - Combined Server & Client */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 text-[12px]">
              <div className="text-slate-500">
                Showing {from} to {to} of {filtered.length} teachers
                {serverPage > 1 && ` (Page ${serverPage} from server)`}
              </div>

              <div className="flex items-center gap-1">
                {/* Server-side Previous */}
                <PageBtn
                  onClick={() => handleServerPageChange(serverPage - 1)}
                  disabled={serverPage <= 1}
                >
                  ‹‹
                </PageBtn>

                {/* Client-side Previous */}
                <PageBtn
                  onClick={() =>
                    setCurrentPage(Math.max(1, currentPageNum - 1))
                  }
                  disabled={currentPageNum <= 1}
                >
                  ‹
                </PageBtn>

                {/* Page Numbers - Client-side */}
                {Array.from(
                  { length: Math.min(totalPages, 5) },
                  (_, i) => i + 1,
                )
                  .filter(
                    (p) => p <= 4 || p === totalPages || p === currentPageNum,
                  )
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && p - arr[idx - 1] > 1 && (
                        <span className="px-1 text-slate-400">…</span>
                      )}
                      <PageBtn
                        active={p === currentPageNum}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </PageBtn>
                    </span>
                  ))}

                {/* Client-side Next */}
                <PageBtn
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPageNum + 1))
                  }
                  disabled={currentPageNum >= totalPages}
                >
                  ›
                </PageBtn>

                {/* Server-side Next */}
                <PageBtn
                  onClick={() => handleServerPageChange(serverPage + 1)}
                  disabled={!hasNext}
                >
                  ››
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
                  <option>50</option>
                </select>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Teacher Detail Modal */}
      <TeacherDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTeacher(null);
        }}
        teacher={selectedTeacher}
        onAction={handleModalAction}
      />
    </AdminLayout>
  );
}

export default Teachers;
