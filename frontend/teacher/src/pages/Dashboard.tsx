import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

import { ButtonClockIn } from "../components/ButtonClockIn";
import { DashboardLayout } from "../components/dashboard/DashboardLayout";
import { QrClockIn } from "../components/QrcodeComponent";
import { useAuth } from "../contexts/AuthContext";
import { useAttendanceMode } from "../hooks/useAttendanceMode";
import { useTimeGreeting } from "../hooks/useTimeGreeting";

export function Dashboard() {
  const { teacher, logout } = useAuth();
  const { greeting } = useTimeGreeting();
  const { action, tapLabel, scanLabel, isClockIn } = useAttendanceMode();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  const teacherName = teacher
    ? `${teacher.firstname} ${teacher.lastname}`.trim()
    : "Teacher";

  return (
    <DashboardLayout
      menuOpen={menuOpen}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onLogout={handleLogout}
    >
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
    </DashboardLayout>
  );
}

export default Dashboard;
