import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ButtonClockIn } from "../components/ButtonClockIn";
import { DashboardLayout } from "../components/dashboard/DashboardLayout";
import { QrClockIn } from "../components/QrcodeComponent";
import { useAuth } from "../contexts/AuthContext";
import { useAttendanceMode } from "../hooks/useAttendanceMode";
import { useTimeGreeting } from "../hooks/useTimeGreeting";

export function Dashboard() {
  const { teacher, logout } = useAuth();
  const { greeting } = useTimeGreeting();
  const { action, tapLabel, scanLabel } = useAttendanceMode();
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
      <section className="text-center">
        <p className="text-base font-medium text-slate-600">{greeting},</p>
        <h2 className="mt-1 text-2xl font-bold text-[#0B2545]">
          {teacherName}
        </h2>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          Digital Attendance System
        </p>
      </section>

      <section className="mt-10 flex flex-col items-center gap-8">
        <ButtonClockIn action={action} label={tapLabel} />
        <QrClockIn action={action} label={scanLabel} />
      </section>
    </DashboardLayout>
  );
}

export default Dashboard;
