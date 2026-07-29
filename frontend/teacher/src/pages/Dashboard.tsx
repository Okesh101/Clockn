// src/pages/TeacherDashboard.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Clock, List } from "lucide-react";
import toast from "react-hot-toast";

import { ButtonClockIn } from "../components/ButtonClockIn";
import { DashboardLayout } from "../components/dashboard/DashboardLayout";
import { QrClockIn } from "../components/QrcodeComponent";
import { RequestClockOutModal } from "../components/RequestClockOutModal";
import { useAuth } from "../contexts/AuthContext";
import { useAttendanceMode } from "../hooks/useAttendanceMode";
import { useTimeGreeting } from "../hooks/useTimeGreeting";

export function Dashboard() {
  const { teacher, logout } = useAuth();
  const { greeting } = useTimeGreeting();
  const { action, tapLabel, scanLabel, isClockIn } = useAttendanceMode();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRequestButton, setShowRequestButton] = useState(false);

  // Check if current time is after 8:05 AM
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // 8:05 AM = 8 hours, 5 minutes
      const isAfter805AM = hours > 8 || (hours === 8 && minutes >= 5);
      setShowRequestButton(isAfter805AM);
    };

    checkTime();
    // Update every minute
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  const teacherName = teacher
    ? `${teacher.firstname} ${teacher.lastname}`.trim()
    : "Teacher";

  const handleRequestSuccess = () => {
    toast.success("Request submitted! You'll be notified once approved.");
  };

  return (
    <DashboardLayout
      menuOpen={menuOpen}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onLogout={handleLogout}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Greeting Section */}
        <section className="rounded-3xl border border-[#0B2545]/10 bg-white/80 p-5 text-center shadow-sm backdrop-blur-sm sm:p-6">
          <p className="text-base font-medium text-slate-600">{greeting},</p>
          <h2 className="mt-1 text-2xl font-bold text-[#0B2545] sm:text-3xl">
            {teacherName}
          </h2>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#0B2545]/5 px-3 py-1.5 text-xs font-semibold text-[#0B2545]">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            {isClockIn
              ? "Clock-in window is open until 3:59 PM"
              : "Clock-out window is active from 4:00 PM"}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-6 flex flex-wrap items-center gap-3">
          {/* Only show Request Early Clock-Out after 8:05 AM */}
          {showRequestButton && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors text-sm font-semibold"
            >
              <Clock className="w-4 h-4" />
              Request Early Clock-Out
            </button>
          )}
          <button
            onClick={() => navigate("/my-requests")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-sm font-semibold"
          >
            <List className="w-4 h-4" />
            My Requests
          </button>
        </section>

        {/* Clock In/Out Section */}
        <section className="mt-8 flex w-full flex-col items-center gap-8 md:mt-10 xl:flex-row xl:items-start xl:justify-center xl:gap-12">
          <div className="flex w-full flex-col items-center xl:flex-1">
            <ButtonClockIn action={action} label={tapLabel} />
          </div>

          <div className="hidden h-px w-full max-w-xs bg-[#0B2545]/10 xl:hidden" />
          <div className="hidden h-48 w-px shrink-0 bg-[#0B2545]/10 xl:block" />

          <div className="flex w-full flex-col items-center xl:flex-1 xl:pt-12">
            <QrClockIn action={action} label={scanLabel} />
          </div>
        </section>
      </div>

      {/* Request Clock Out Modal */}
      <RequestClockOutModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={handleRequestSuccess}
      />
    </DashboardLayout>
  );
}

export default Dashboard;
