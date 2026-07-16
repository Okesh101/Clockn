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
  LucideMessageCircleCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AdminLayout } from "../components/dashboard/AdminLayout";
import { Button } from "../components/ui/form";
import { useAuth } from "../contexts/AuthContext";
import { fetchTeachers, type TeacherListItem } from "../services/teachersApi";
import { cn } from "../lib/utils";
import { TeacherDetailModal } from "../components/TeacherDetailModal";

// ============================================
// KPI Cards Component
// ============================================

const KPI_STYLES = {
  total: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    iconBg: "bg-[#2563EB]",
    icon: User,
  },
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    iconBg: "bg-[#16A34A]",
    icon: User,
  },
  inactive: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    iconBg: "bg-[#D97706]",
    icon: User,
  },
} as const;

interface KpiCardProps {
  label: string;
  value: number | string;
  tone: keyof typeof KPI_STYLES;
}

function KpiCard({ label, value, tone }: KpiCardProps) {
  const style = KPI_STYLES[tone];
  const Icon = style.icon;

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
// Action Types & Components
// ============================================

type TeacherAction = "call" | "email" | "whatsapp" | "view" | "message";

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
  whatsapp: {
    label: "WhatsApp",
    icon: LucideMessageCircleCheck,
    color: "text-green-700 border-green-500/50 hover:bg-green-50",
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

// ============================================
// Main Teachers Component
// ============================================

export function Teachers() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [hasPrev, setHasPrev] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] =
    useState<TeacherListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [summaryLoaded, setSummaryLoaded] = useState<boolean>(false);

  // KPI summary (loads once)
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  const PER_PAGE = 20; // Matches backend

  // Load teachers from server with server-side pagination
  const loadTeachers = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchTeachers(currentPage);

      setTeachers(response.data ?? []);
      setTotalItems(response.meta?.total_items ?? 0);
      setTotalPages(response.meta?.total_pages ?? 1);
      setHasNext(response.meta?.has_next ?? false);
      setHasPrev(response.meta?.has_prev ?? false);

      // Only set summary on first load
      if (!summaryLoaded) {
        setSummary({
          total: response.meta?.total_items ?? 0,
          active: response.meta?.total_items ?? 0,
          inactive: 0,
        });
        setSummaryLoaded(true);
      }
    } catch (err) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.data?.message || "Failed to load teachers."
          : "Failed to load teachers.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, summaryLoaded]);

  // Reload teachers when page changes
  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  // Filter teachers client-side (search and status)
  const filtered = useMemo(() => {
    return teachers.filter((teacher) => {
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
  }, [teachers, search]);

  // Calculate display range
  const from = teachers.length ? (currentPage - 1) * PER_PAGE + 1 : 0;
  const to = Math.min(currentPage * PER_PAGE, totalItems);

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate("/auth", { replace: true });
  };

  // Handle page change
  const handlePageChange = (page: number): void => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
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

  // Handle teacher actions
  const handleTeacherAction = (
    action: TeacherAction,
    teacherId: string,
  ): void => {
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

      case "whatsapp":
        if (teacher.phone) {
          let phone = teacher.phone.replace(/\D/g, "");
          if (phone.startsWith("0")) {
            phone = "234" + phone.substring(1);
          }
          if (!phone.startsWith("234")) {
            phone = "234" + phone;
          }
          const message = encodeURIComponent(
            `Hello ${teacher.name},\n\nI hope this message finds you well.\n\nBest regards,\nSchool Administration`,
          );
          window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
        } else {
          alert("No phone number available for WhatsApp.");
        }
        break;

      case "email":
        if (teacher.email) {
          const subject = encodeURIComponent("School Attendance Update");
          const body = encodeURIComponent(
            `Hello ${teacher.name},\n\nI hope this email finds you well.\n\nBest regards,\nSchool Administration`,
          );

          const isMobile = /Android|iPhone|iPad|iPod/i.test(
            navigator.userAgent,
          );

          if (isMobile) {
            const gmailLink = `googlegmail://co?to=${teacher.email}&subject=${subject}&body=${body}`;
            const mailtoLink = `mailto:${teacher.email}?subject=${subject}&body=${body}`;

            try {
              window.location.href = gmailLink;
              setTimeout(() => {
                window.location.href = mailtoLink;
              }, 1000);
            } catch (error) {
              window.location.href = mailtoLink;
            }
          } else {
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

  const handleModalAction = (action: string, teacherId: string): void => {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* KPI Cards - Static once loaded */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <KpiCard label="Total Teachers" value={summary.total} tone="total" />
          <KpiCard label="Active" value={summary.active} tone="active" />
          <KpiCard label="Inactive" value={summary.inactive} tone="inactive" />
        </section>

        {/* Teachers Table */}
        <section className="bg-white rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
            <h2 className="text-[14px] font-bold uppercase tracking-wide text-[#0B2545]">
              All Teachers
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500">
                {totalItems} teachers
              </span>
              <Button
                type="button"
                onClick={() => {
                  setSummaryLoaded(false);
                  loadTeachers();
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
            <FilterSelect
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
              }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FilterSelect>

            <div className="relative flex-1 min-w-[200px] ml-auto">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                placeholder="Search by name, email or phone"
                className="w-full pl-8 pr-3 py-2 text-[12.5px] rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 m-4 text-sm text-red-800">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No teachers match these filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-[12.5px] min-w-[700px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50/40">
                      <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
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
                        Joined
                      </th>
                      <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((teacher, index) => {
                      const globalIndex =
                        (currentPage - 1) * PER_PAGE + index + 1;

                      return (
                        <tr
                          key={teacher.id}
                          className="border-t border-slate-100 hover:bg-slate-50/70"
                        >
                          <td className="px-4 py-2.5 font-mono text-slate-500 font-semibold whitespace-nowrap">
                            {globalIndex}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-[#0B2545] whitespace-nowrap">
                            {teacher.name}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 truncate max-w-[150px]">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{teacher.email}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              {teacher.phone || "—"}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                            {teacher.created_at
                              ? new Date(
                                  teacher.created_at,
                                ).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <NextActionButton
                              actions={["call", "whatsapp", "email", "view"]}
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

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 text-[12px]">
                <div className="text-slate-500">
                  Showing {from} to {to} of {totalItems} teachers
                </div>

                <div className="flex items-center gap-1">
                  <PageBtn
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPrev || loading}
                  >
                    ‹
                  </PageBtn>

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

        {/* Teacher Detail Modal */}
        <TeacherDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTeacher(null);
          }}
          teacher={selectedTeacher}
          onAction={handleModalAction}
          onRefresh={loadTeachers}
        />
      </div>
    </AdminLayout>
  );
}

export default Teachers;
