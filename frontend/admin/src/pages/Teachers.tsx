import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Loader2, Mail, Phone, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AdminLayout } from "../components/dashboard/AdminLayout";
import { Button } from "../components/ui/form";
import { useAuth } from "../contexts/AuthContext";
import { fetchTeachers, type TeacherListItem } from "../services/teachersApi";

export function Teachers() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchTeachers(page);
      setTeachers(response.data ?? []);
      setHasNext(response.meta?.has_next ?? false);
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? err.response?.data?.message || "Failed to load teachers."
          : "Failed to load teachers.",
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  return (
    <AdminLayout
      title="Teachers"
      menuOpen={menuOpen}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onLogout={handleLogout}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#0B2545]">Teachers</h2>
          <p className="text-sm text-slate-500">All registered school teachers</p>
        </div>
        <Button
          type="button"
          onClick={loadTeachers}
          className="h-9 bg-white px-3 text-[#0B2545] ring-1 ring-slate-200"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {teachers.map((teacher) => (
              <article
                key={teacher.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <h3 className="font-bold text-[#0B2545]">{teacher.name}</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {teacher.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {teacher.phone || "—"}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {(page > 1 || hasNext) && (
            <div className="mt-6 flex items-center justify-between">
              <Button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-9 bg-white px-4 ring-1 ring-slate-200 disabled:opacity-40"
              >
                Previous
              </Button>
              <span className="text-sm text-slate-500">Page {page}</span>
              <Button
                type="button"
                disabled={!hasNext}
                onClick={() => setPage((p) => p + 1)}
                className="h-9 bg-white px-4 ring-1 ring-slate-200 disabled:opacity-40"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}

export default Teachers;
