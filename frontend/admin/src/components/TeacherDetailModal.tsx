// src/components/TeacherDetailModal.tsx
import {
  X,
  Mail,
  Phone,
  Calendar,
  Clock,
  User,
  MessageSquare,
  Send,
  LucideMessageCircleCheck,
} from "lucide-react";

interface TeacherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    created_at: string | null;
    // Add other fields as needed
  } | null;
  onAction?: (action: string, teacherId: string) => void;
}

export function TeacherDetailModal({
  isOpen,
  onClose,
  teacher,
  onAction,
}: TeacherDetailModalProps) {
  if (!isOpen || !teacher) return null;

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action, teacher.id);
    }
  };

  // Format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone: string): string => {
    // Remove any non-numeric characters
    let cleaned = phone.replace(/\D/g, "");

    // If number starts with 0, replace with country code (assuming Nigeria)
    if (cleaned.startsWith("0")) {
      cleaned = "234" + cleaned.substring(1);
    }

    // If number doesn't start with country code, add it
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
