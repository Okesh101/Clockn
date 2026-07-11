import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Loader2, MapPin, Plus, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { AdminLayout } from "../components/dashboard/AdminLayout";
import { Button, Input, Label } from "../components/ui/form";
import { useAuth } from "../contexts/AuthContext";
import {
  createQrLocation,
  fetchQrLocations,
  type QrLocation,
} from "../services/qrcodeApi";

export function QrCodes() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [locations, setLocations] = useState<QrLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    location: "",
    latitude: "",
    longitude: "",
  });

  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLocations(await fetchQrLocations());
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? err.response?.data?.message || "Failed to load QR locations."
          : "Failed to load QR locations.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await createQrLocation({
        location: form.location.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      });
      toast.success("QR location created.");
      setForm({ location: "", latitude: "", longitude: "" });
      await loadLocations();
    } catch (err) {
      toast.error(
        err instanceof AxiosError
          ? err.response?.data?.message || "Failed to create QR location."
          : "Failed to create QR location.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title="QR Codes"
      menuOpen={menuOpen}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onLogout={handleLogout}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#0B2545]">QR Codes</h2>
          <p className="text-sm text-slate-500">
            Manage campus QR clock-in locations
          </p>
        </div>
        <Button
          type="button"
          onClick={loadLocations}
          className="h-9 bg-white px-3 text-[#0B2545] ring-1 ring-slate-200"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <form
        onSubmit={handleCreate}
        className="mb-8 rounded-2xl border border-[#0B2545]/10 bg-white p-5 shadow-sm"
      >
        <h3 className="mb-4 flex items-center gap-2 font-bold text-[#0B2545]">
          <Plus className="h-4 w-4" />
          Create QR Location
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="location">Location name</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="Main Gate"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, latitude: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, longitude: e.target.value }))
              }
              required
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="mt-4 h-10 bg-[#0B2545] px-5 text-white hover:bg-[#12345c]"
        >
          {submitting ? "Creating…" : "Create Location"}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          {error}
        </div>
      ) : locations.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No QR locations yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {locations.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B2545]/8 text-[#0B2545]">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-[#0B2545]">{item.location}</h3>
                  <p className="mt-1 break-all text-xs text-slate-500">
                    QR: {item.qr_string}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {item.latitude}, {item.longitude}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

export default QrCodes;
