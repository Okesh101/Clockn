// src/pages/QrCodes.tsx

import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Download,
  X,
  Navigation,
  QrCode as QrCodeIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";

import { AdminLayout } from "../components/dashboard/AdminLayout";
import { Button, Input, Label } from "../components/ui/form";
import { useAuth } from "../contexts/AuthContext";
import {
  createQrLocation,
  fetchQrLocations,
  type QrLocation,
} from "../services/qrcodeApi";
import { cn } from "../lib/utils";

// ============================================
// Types
// ============================================

interface QRFormData {
  location: string;
  latitude: string;
  longitude: string;
}

interface KpiCardProps {
  label: string;
  value: number;
  tone: "total" | "active";
}

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: QrLocation | null;
  onDownload: (qrDataUrl: string, locationName: string) => void;
}

// ============================================
// KPI Card Component
// ============================================

const KPI_STYLES = {
  total: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    iconBg: "bg-[#2563EB]",
  },
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    iconBg: "bg-[#16A34A]",
  },
} as const;

function KpiCard({ label, value, tone }: KpiCardProps) {
  const style = KPI_STYLES[tone];

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 p-4 flex flex-col hover:shadow-sm transition-shadow",
        style.bg,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={cn(
            "w-7 h-7 rounded-full grid place-items-center shrink-0",
            style.iconBg,
            "text-white",
          )}
        >
          <QrCodeIcon className="w-4 h-4" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <p className={cn("text-[28px] font-extrabold leading-none", style.text)}>
        {value}
      </p>
    </div>
  );
}

// ============================================
// QR Code Modal Component
// ============================================

function QRModal({ isOpen, onClose, location, onDownload }: QRModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && location) {
      setIsGenerating(true);
      const qrValue = location.qr_string || `qr_${location.id}`;

      QRCode.toDataURL(qrValue, {
        width: 300,
        margin: 2,
        color: {
          dark: "#0B2545",
          light: "#FFFFFF",
        },
      })
        .then((url: string) => {
          setQrDataUrl(url);
          setIsGenerating(false);
        })
        .catch((err: Error) => {
          console.error("Error generating QR code:", err);
          toast.error("Failed to generate QR code");
          setIsGenerating(false);
        });
    }
  }, [isOpen, location]);

  if (!isOpen || !location) {
    return null;
  }

  const handleDownload = (): void => {
    if (qrDataUrl) {
      onDownload(qrDataUrl, location.location);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0B2545]">QR Code</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-4">
            <h3 className="font-semibold text-[#0B2545] text-lg">
              {location.location}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          </div>

          <div className="flex justify-center mb-6">
            {isGenerating ? (
              <div className="w-64 h-64 rounded-lg border border-slate-200 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code for ${location.location}`}
                className="w-64 h-64 rounded-lg border border-slate-200 object-contain"
              />
            ) : (
              <div className="w-64 h-64 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
                Failed to generate QR code
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownload}
              disabled={!qrDataUrl || isGenerating}
              className="flex-1 h-10 bg-[#0B2545] text-white hover:bg-[#12345c] disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PNG
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 h-10 bg-white text-[#0B2545] ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function QrCodes() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [locations, setLocations] = useState<QrLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [detectingLocation, setDetectingLocation] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<QrLocation | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [form, setForm] = useState<QRFormData>({
    location: "",
    latitude: "",
    longitude: "",
  });

  // Load locations
  const loadLocations = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchQrLocations();
      setLocations(data);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.data?.message || "Failed to load QR locations."
          : "Failed to load QR locations.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  // Handle logout
  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate("/auth", { replace: true });
  };

  // Detect current location
  const detectCurrentLocation = (): void => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        setForm((prev: QRFormData) => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
        setDetectingLocation(false);
        toast.success("Location detected successfully!");
      },
      (error: GeolocationPositionError) => {
        console.error("Geolocation error:", error);
        toast.error(
          "Failed to detect location. Please enter coordinates manually.",
        );
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  // Handle form submission
  const handleCreate = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const newLocation: QrLocation = await createQrLocation({
        location: form.location.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      });

      toast.success("QR location created successfully!");
      setForm({ location: "", latitude: "", longitude: "" });
      await loadLocations();

      // Show the QR code modal for the newly created location
      setSelectedLocation(newLocation);
      setIsModalOpen(true);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.data?.message || "Failed to create QR location."
          : "Failed to create QR location.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle view QR
  const handleViewQR = (location: QrLocation): void => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  // Handle download QR
  const handleDownloadQR = (qrDataUrl: string, locationName: string): void => {
    const link = document.createElement("a");
    link.download = `QR_${locationName.replace(/\s+/g, "_")}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR code downloaded successfully!");
  };

  // Calculate stats
  const stats = {
    total: locations.length,
    active: locations.length,
  };

  return (
    <AdminLayout
      title="QR Codes"
      menuOpen={menuOpen}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onLogout={handleLogout}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard label="Total Locations" value={stats.total} tone="total" />
          <KpiCard label="Active QR Codes" value={stats.active} tone="active" />
        </section>

        {/* Create QR Location Form */}
        <section className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="px-4 py-3 border-b border-slate-200">
            <h3 className="text-[14px] font-bold uppercase tracking-wide text-[#0B2545] flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Register New QR Location
            </h3>
          </div>

          <form onSubmit={handleCreate} className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Location Name */}
              <div className="space-y-2">
                <Label htmlFor="location">Location Name</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((prev: QRFormData) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="e.g., Main Gate, Admin Block"
                  required
                  className="w-full"
                />
              </div>

              {/* Latitude */}
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((prev: QRFormData) => ({
                      ...prev,
                      latitude: e.target.value,
                    }))
                  }
                  required
                  placeholder="e.g., 6.5244"
                  className="w-full"
                />
              </div>

              {/* Longitude */}
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((prev: QRFormData) => ({
                      ...prev,
                      longitude: e.target.value,
                    }))
                  }
                  required
                  placeholder="e.g., 7.5391"
                  className="w-full"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                type="submit"
                disabled={submitting}
                className="h-10 bg-[#0B2545] px-6 text-white hover:bg-[#12345c] disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create QR Location
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={detectCurrentLocation}
                disabled={detectingLocation}
                className="h-10 bg-white px-4 text-[#0B2545] ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
              >
                <Navigation className="h-4 w-4 mr-2" />
                {detectingLocation ? "Detecting..." : "Detect My Location"}
              </Button>
            </div>
          </form>
        </section>

        {/* Locations Table */}
        <section className="bg-white rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
            <h2 className="text-[14px] font-bold uppercase tracking-wide text-[#0B2545]">
              Registered QR Locations
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500">
                {locations.length} locations
              </span>
              <Button
                type="button"
                onClick={loadLocations}
                className="h-8 bg-white px-3 text-[#0B2545] ring-1 ring-slate-200 hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
            </div>
          ) : error ? (
            <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
              {error}
            </div>
          ) : locations.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No QR locations registered yet. Create one above!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px] min-w-[700px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50/40">
                    <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
                      S/N
                    </th>
                    <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                      Location
                    </th>
                    <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                      Coordinates
                    </th>
                    <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                      QR Code
                    </th>
                    <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                      Created
                    </th>
                    <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location: QrLocation, index: number) => (
                    <tr
                      key={location.id}
                      className="border-t border-slate-100 hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-2.5 font-mono text-slate-500 font-semibold whitespace-nowrap">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-[#0B2545] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          {location.location}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 font-mono text-xs whitespace-nowrap">
                        {location.latitude.toFixed(6)},{" "}
                        {location.longitude.toFixed(6)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[11px] font-medium">
                          {location.qr_string
                            ? location.qr_string.substring(0, 12) + "..."
                            : "N/A"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                        {location.created_at
                          ? new Date(location.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <Button
                          onClick={() => handleViewQR(location)}
                          className="h-8 px-3 bg-[#0B2545] text-white hover:bg-[#12345c] text-[11px]"
                        >
                          <QrCodeIcon className="w-3.5 h-3.5 mr-1" />
                          View QR
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* QR Code Modal */}
      <QRModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLocation(null);
        }}
        location={selectedLocation}
        onDownload={handleDownloadQR}
      />
    </AdminLayout>
  );
}

export default QrCodes;
