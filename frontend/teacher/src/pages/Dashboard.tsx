// src/pages/Dashboard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTimeGreeting } from "../hooks/useTimeGreeting";
import { ButtonClockIn } from "../components/ButtonClockIn";
import { QrClockIn } from "../components/QrcodeComponent";

export const Dashboard: React.FC = () => {
  const { teacher, logout } = useAuth();
  const { greeting } = useTimeGreeting();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  const initials = teacher
    ? `${teacher.firstname?.[0] ?? ""}${teacher.lastname?.[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="border-b border-gray-100 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 font-bold text-white">
              {initials}
            </div>
            <div>
              <p className="text-sm text-gray-500">{greeting},</p>
              <p className="font-semibold text-gray-800">
                {teacher?.firstname} {teacher?.lastname}
              </p>
              <p className="text-xs text-gray-400">{teacher?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="gradient-text text-3xl font-bold">Mark Attendance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Clock in when you arrive and clock out after 4:00&nbsp;PM.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-card p-2">
            <ButtonClockIn />
          </div>
          <div className="glass-card flex items-center justify-center p-2">
            <QrClockIn />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
