// src/components/TeacherDetailModal.tsx

import { useState, useEffect } from "react";
import {
  X,
  Mail,
  Phone,
  Calendar,
  Clock,
  User,
  Send,
  LucideMessageCircleCheck,
  Shield,
  Check,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";
import { assignRoles, fetchRolesAndPermissions } from "../services/rolesApi";
import { fetchTeacherById } from "../services/teachersApi";

interface TeacherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    created_at: string | null;
    roles?: string[];
  } | null;
  onAction?: (action: string, teacherId: string) => void;
  onRefresh?: () => void;
}

export function TeacherDetailModal({
  isOpen,
  onClose,
  teacher,
  onAction,
  onRefresh,
}: TeacherDetailModalProps) {
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);

  useEffect(() => {
    if (isOpen && teacher) {
      loadRoles();
      // Set initial selected roles from teacher data
      setSelectedRoles(teacher.roles || []);
    }
  }, [isOpen, teacher]);

  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const data = await fetchRolesAndPermissions();
      setAvailableRoles(data.roles.map((r) => r.name));

      // Refresh teacher data to get latest roles
      if (teacher) {
        const updatedTeacher = await fetchTeacherById(teacher.id);
        if (updatedTeacher) {
          setSelectedRoles(updatedTeacher.roles || []);
        }
      }
    } catch (error) {
      console.error("Failed to load roles:", error);
    } finally {
      setLoadingRoles(false);
    }
  };

  if (!isOpen || !teacher) return null;

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action, teacher.id);
    }
  };

  const handleSaveRoles = async () => {
    setSavingRoles(true);
    try {
      await assignRoles(teacher.id, selectedRoles);
      toast.success(`Roles updated for ${teacher.name}`);

      // Refresh teacher data to get updated roles
      const updatedTeacher = await fetchTeacherById(teacher.id);
      if (updatedTeacher) {
        setSelectedRoles(updatedTeacher.roles || []);
      }

      if (onRefresh) onRefresh();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update roles";
      toast.error(errorMessage);
    } finally {
      setSavingRoles(false);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  // Format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "234" + cleaned.substring(1);
    }
    if (!cleaned.startsWith("234")) {
      cleaned = "234" + cleaned;
    }
    return cleaned;
  };

  const handleWhatsApp = () => {
    if (teacher.phone) {
      const formattedPhone = formatPhoneForWhatsApp(teacher.phone);
      const message = encodeURIComponent(
        `Hello ${teacher.name},\n\nI hope this message finds you well.\n\nBest regards,\nSchool Administration`,
      );
      window.open(`https://wa.me/${formattedPhone}?text=${message}`, "_blank");
    } else {
      alert("No phone number available for WhatsApp.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-0 sm:m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#0B2545] truncate">
                {teacher.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Teacher Profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-blue-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-medium">Email</p>
                  <p className="text-sm font-semibold text-[#0B2545] truncate">
                    {teacher.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-green-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-medium">Phone</p>
                  <p className="text-sm font-semibold text-[#0B2545] truncate">
                    {teacher.phone || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-purple-700" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Joined</p>
                  <p className="text-sm font-semibold text-[#0B2545]">
                    {teacher.created_at
                      ? new Date(teacher.created_at).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Status</p>
                  <p className="text-sm font-semibold text-[#0B2545]">Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Roles Section */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#0B2545] flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Roles & Permissions
              </h3>
              {selectedRoles.length > 0 && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  {selectedRoles.length} role
                  {selectedRoles.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {loadingRoles ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {availableRoles.map((role) => {
                    const isSelected = selectedRoles.includes(role);
                    return (
                      <button
                        key={role}
                        onClick={() => toggleRole(role)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                          isSelected
                            ? "bg-[#0B2545] text-white ring-2 ring-[#0B2545] ring-offset-1"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          {isSelected && <Check className="w-3 h-3" />}
                          {role}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={handleSaveRoles}
                    disabled={savingRoles}
                    className="px-4 py-1.5 bg-[#0B2545] text-white rounded-lg text-xs font-semibold hover:bg-[#1a3a5c] transition-colors disabled:opacity-50"
                  >
                    {savingRoles ? (
                      <>
                        <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Roles"
                    )}
                  </button>
                  {selectedRoles.length > 0 && (
                    <span className="text-xs text-slate-400">
                      {selectedRoles.length} role
                      {selectedRoles.length > 1 ? "s" : ""} assigned
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-[#0B2545] mb-3">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              {teacher.phone && (
                <>
                  <button
                    onClick={() => handleAction("call")}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-xs sm:text-sm font-semibold flex-1 sm:flex-none min-w-[80px] justify-center"
                  >
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Call</span>
                  </button>

                  <button
                    onClick={handleWhatsApp}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-xs sm:text-sm font-semibold flex-1 sm:flex-none min-w-[80px] justify-center"
                  >
                    <LucideMessageCircleCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>WhatsApp</span>
                  </button>
                </>
              )}

              <button
                onClick={() => handleAction("email")}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs sm:text-sm font-semibold flex-1 sm:flex-none min-w-[80px] justify-center"
              >
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Email</span>
              </button>

              <button
                onClick={() => handleAction("message")}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-xs sm:text-sm font-semibold flex-1 sm:flex-none min-w-[80px] justify-center"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Message</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
