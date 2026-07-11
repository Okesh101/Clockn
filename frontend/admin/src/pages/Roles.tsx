import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { AdminLayout } from "../components/dashboard/AdminLayout";
import { Button, Label } from "../components/ui/form";
import { useAuth } from "../contexts/AuthContext";
import { assignRoles } from "../services/rolesApi";
import { fetchTeacherById, fetchTeachers, type TeacherListItem } from "../services/teachersApi";
import type { AdminUser } from "../types";

const AVAILABLE_ROLES = ["Teacher", "Admin"] as const;

export function Roles() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<AdminUser | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadTeachers = useCallback(async () => {
    setLoadingList(true);
    try {
      const response = await fetchTeachers(1);
      setTeachers(response.data ?? []);
    } catch {
      toast.error("Failed to load teachers.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedTeacher(null);
      setSelectedRoles([]);
      return;
    }

    (async () => {
      setLoadingDetail(true);
      try {
        const teacher = await fetchTeacherById(selectedId);
        setSelectedTeacher(teacher ?? null);
        setSelectedRoles(teacher?.roles ?? []);
      } catch {
        toast.error("Failed to load teacher details.");
      } finally {
        setLoadingDetail(false);
      }
    })();
  }, [selectedId]);

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleAssign = async () => {
    if (!selectedId || selectedRoles.length === 0) {
      toast.error("Select a teacher and at least one role.");
      return;
    }

    setSubmitting(true);
    try {
      await assignRoles(selectedId, selectedRoles);
      toast.success("Roles updated successfully.");
      const teacher = await fetchTeacherById(selectedId);
      setSelectedTeacher(teacher ?? null);
      setSelectedRoles(teacher?.roles ?? []);
    } catch (err) {
      toast.error(
        err instanceof AxiosError
          ? err.response?.data?.message || "Failed to assign roles."
          : "Failed to assign roles.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title="Roles"
      menuOpen={menuOpen}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onLogout={handleLogout}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0B2545]">Role Management</h2>
        <p className="text-sm text-slate-500">
          Upgrade or assign roles to teachers
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Label htmlFor="teacher-select">Select teacher</Label>
          {loadingList ? (
            <div className="mt-4 flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#0B2545]" />
            </div>
          ) : (
            <select
              id="teacher-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#0B2545]"
            >
              <option value="">Choose a teacher…</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} — {teacher.email}
                </option>
              ))}
            </select>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {loadingDetail ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#0B2545]" />
            </div>
          ) : !selectedTeacher ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Select a teacher to manage their roles.
            </p>
          ) : (
            <>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B2545]/8 text-[#0B2545]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-[#0B2545]">
                    {selectedTeacher.firstname} {selectedTeacher.lastname}
                  </p>
                  <p className="text-sm text-slate-500">{selectedTeacher.email}</p>
                </div>
              </div>

              <p className="mb-3 text-sm font-semibold text-slate-700">Assign roles</p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ROLES.map((role) => {
                  const active = selectedRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-[#0B2545] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>

              <Button
                type="button"
                disabled={submitting}
                onClick={handleAssign}
                className="mt-6 h-10 bg-[#0B2545] px-5 text-white hover:bg-[#12345c]"
              >
                {submitting ? "Saving…" : "Save Roles"}
              </Button>
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

export default Roles;
