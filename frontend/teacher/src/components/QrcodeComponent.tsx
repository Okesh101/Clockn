// src/components/QrcodeComponent.tsx
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { AxiosError } from "axios";
import {
  ChevronRight,
  Loader2,
  QrCode,
  ScanLine,
  Sparkles,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import type { AttendanceAction } from "../hooks/useAttendanceMode";
import api from "../utils/axiosConfig";
import { getPosition } from "../utils/geolocation";

interface QrClockInProps {
  action: AttendanceAction;
  label: string;
}

export function QrClockIn({ action, label }: QrClockInProps) {
  const [statusMessage, setStatusMessage] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const isClockIn = action === "in";
  const busy = isScanning || isSubmitting;

  useEffect(() => {
    return () => {
      if (qrScannerRef.current?.isScanning) {
        qrScannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const submitScan = async (qrString: string) => {
    setIsSubmitting(true);
    try {
      setStatusMessage("QR detected. Fetching location…");
      const position = await getPosition();
      const { latitude, longitude } = position.coords;

      const payload = isClockIn
        ? { qrString, timeInLat: latitude, timeInLng: longitude }
        : { qrString, timeOutLat: latitude, timeOutLng: longitude };

      const { data } = await api.post(`/attendance/qr/${action}`, payload);
      const successMessage =
        data.message ||
        (isClockIn ? "Clock-in successful." : "Clock-out successful.");

      setStatusMessage(successMessage);
      toast.success(successMessage);
    } catch (error) {
      const fallback = "QR attendance failed.";
      if (error instanceof AxiosError) {
        setStatusMessage(
          error.response?.data?.message || "Server error. Please try again.",
        );
      } else if (error instanceof Error) {
        setStatusMessage(error.message);
      } else {
        setStatusMessage("Network error. Please try again.");
      }
      toast.error(fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startScanner = async () => {
    if (busy) return;

    setIsScanning(true);
    setStatusMessage("Opening camera…");

    // Small delay to ensure DOM is ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      qrScannerRef.current = html5QrCode;

      // Get the container dimensions for a proper square
      const container = document.getElementById("qr-reader");
      const containerWidth = container?.clientWidth || 300;
      const qrboxSize = Math.min(containerWidth - 40, 280);

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: {
            width: qrboxSize,
            height: qrboxSize,
          },
          aspectRatio: 1,
        },
        (decodedText) => {
          html5QrCode
            .stop()
            .then(() => {
              setIsScanning(false);
              submitScan(decodedText);
            })
            .catch(console.error);
        },
        () => {},
      );
      setStatusMessage("Align the QR code within the frame.");
    } catch (err) {
      console.error("Camera startup failed:", err);
      setStatusMessage("Could not access camera permissions.");
      setIsScanning(false);
    }
  };

  const closeScanner = async () => {
    if (qrScannerRef.current?.isScanning) {
      await qrScannerRef.current.stop();
    }
    setIsScanning(false);
    setStatusMessage("Scan cancelled.");
  };

  return (
    <>
      <div className="w-full max-w-md">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#0B2545]/45">
          Or use QR
        </p>

        <button
          type="button"
          onClick={startScanner}
          disabled={busy}
          className={`group relative w-full overflow-hidden rounded-2xl p-[1.5px] shadow-lg transition-all cursor-pointer hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
            isClockIn
              ? "bg-gradient-to-r from-[#0B2545] via-[#12345c] to-emerald-700"
              : "bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600"
          }`}
        >
          <div className="flex items-center gap-4 rounded-[14px] bg-white px-5 py-4 sm:px-6 sm:py-5">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                isClockIn
                  ? "bg-[#0B2545]/10 text-[#0B2545]"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {isClockIn ? (
                <QrCode className="h-6 w-6" strokeWidth={2.2} />
              ) : (
                <ScanLine className="h-6 w-6" strokeWidth={2.2} />
              )}
            </div>

            <div className="min-w-0 flex-1 text-left">
              {isSubmitting ? (
                <div className="flex items-center gap-2 text-sm font-bold text-[#0B2545]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </div>
              ) : (
                <>
                  <p className="truncate text-base font-bold text-[#0B2545] sm:text-lg">
                    {label}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 sm:text-sm">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    Fast camera scan at the school QR post
                  </p>
                </>
              )}
            </div>

            <ChevronRight className="h-5 w-5 shrink-0 text-[#0B2545]/40 transition group-hover:translate-x-0.5 group-hover:text-[#0B2545]" />
          </div>
        </button>
      </div>

      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2545]/85 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-[#0B2545] to-[#12345c] px-5 py-4 text-white">
              <div>
                <h3 className="text-base font-bold">
                  {isClockIn ? "Scan to clock in" : "Scan to clock out"}
                </h3>
                <p className="text-xs text-white/75">
                  Point your camera at the school QR code
                </p>
              </div>
              <button
                type="button"
                onClick={closeScanner}
                aria-label="Close scanner"
                className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-dashed border-[#0B2545]/20 bg-slate-950">
                <div
                  id="qr-reader"
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {/* The QR reader will render here */}
                </div>
              </div>
              <p className="mt-3 text-center text-xs font-medium text-slate-500">
                Hold steady until the code is detected
              </p>
            </div>
          </div>
        </div>
      )}

      {statusMessage && !isScanning && (
        <p className="mt-3 text-center text-xs font-medium text-slate-600">
          {statusMessage}
        </p>
      )}
    </>
  );
}
