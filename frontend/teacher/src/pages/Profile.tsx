import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  AtSign,
  CalendarDays,
  Loader2,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { DashboardLayout } from "../components/dashboard/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import type { Teacher } from "../types";
import api from "../utils/axiosConfig";

function formatMemberSince(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#0B2545]/8 bg-white px-4 py-3.5 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B2545]/8 text-[#0B2545]">
        <Icon className="h-4 w-4" strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0B2545]/50">
          {label}
        </p>
        <p className="mt-0.5 break-words text-sm font-semibold text-[#0B2545]">
          {value}
        </p>
      </div>
    </div>
  );
}

export function Profile() {
  const { teacher: cachedTeacher, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [teacher, setTeacher] = useState<Teacher | null>(cachedTeacher);
  const [loading, setLoading] = useState(!cachedTeacher);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<{ data: Teacher }>("/auth/profile");
      setTeacher(data.data);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message || "Could not load your profile.",
        );
      } else {
        setError("Could not load your profile.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  const profile = teacher ?? cachedTeacher;
  const initials = profile
    ? `${profile.firstname?.[0] ?? ""}${profile.lastname?.[0] ?? ""}`.toUpperCase()
    : "T";

  return (
    <DashboardLayout
      menuOpen={menuOpen}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onLogout={handleLogout}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0B2545]">Profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          Your school account details
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#0B2545]" />
          <p className="text-sm font-medium">Loading profile…</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadProfile}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0B2545] ring-1 ring-red-200"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      ) : profile ? (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-[#0B2545]/10 bg-white shadow-[0_20px_60px_-30px_rgba(11,37,69,0.25)]">
            <div className="bg-gradient-to-r from-[#0B2545] to-[#12345c] px-6 py-8 text-white">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold">
                  {initials}
                </div>
                <div>
                  <p className="text-xl font-bold">
                    {profile.firstname} {profile.lastname}
                  </p>
                  <p className="mt-1 text-sm text-white/75">{profile.email}</p>
                  {profile.roles?.length ? (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {profile.roles.join(", ")}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <ProfileField
                icon={UserRound}
                label="Full name"
                value={`${profile.firstname} ${profile.lastname}`}
              />
              <ProfileField
                icon={AtSign}
                label="Email"
                value={profile.email}
              />
              <ProfileField
                icon={Phone}
                label="Phone"
                value={profile.phone || "—"}
              />
              <ProfileField
                icon={CalendarDays}
                label="Member since"
                value={formatMemberSince(profile.created_at)}
              />
            </div>
          </section>

          <button
            type="button"
            onClick={loadProfile}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0B2545] ring-1 ring-[#0B2545]/10 transition hover:bg-[#0B2545]/5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh profile
          </button>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

export default Profile;
