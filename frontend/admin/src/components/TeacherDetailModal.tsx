// src/components/TeacherDetailModal.tsx
import {
  X,
  Mail,
  Phone,
  Calendar,
  Clock,
  User,
  MessageSquare,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0B2545]">
                {teacher.name}
              </h2>
              <p className="text-sm text-slate-500">Teacher Profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Email</p>
                  <p className="text-sm font-semibold text-[#0B2545]">
                    {teacher.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-green-700" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Phone</p>
                  <p className="text-sm font-semibold text-[#0B2545]">
                    {teacher.phone || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
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

            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
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
                <button
                  onClick={() => handleAction("call")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-semibold"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </button>
              )}
              <button
                onClick={() => handleAction("email")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold"
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                onClick={() => handleAction("message")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-semibold"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
