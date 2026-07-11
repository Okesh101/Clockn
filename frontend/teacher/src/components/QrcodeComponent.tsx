import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { AxiosError } from "axios";
import { Camera, Loader2, ScanLine, X } from "lucide-react";
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

    window.setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        qrScannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
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
    }, 150);
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
      <button
        type="button"
        onClick={startScanner}
        disabled={busy}
        className={`flex w-full max-w-sm items-center justify-center gap-2.5 rounded-2xl px-6 py-4 text-sm font-bold shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
          isClockIn
            ? "bg-white text-[#0B2545] ring-1 ring-slate-200 hover:bg-slate-50"
            : "bg-amber-50 text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            {isClockIn ? (
              <Camera className="h-4 w-4" />
            ) : (
              <ScanLine className="h-4 w-4" />
            )}
            {label}
          </>
        )}
      </button>

      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-4 sm:items-center">
          <div className="relative w-full max-w-sm overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isClockIn ? "Scan to clock in" : "Scan to clock out"}
                </h3>
                <p className="text-xs text-slate-500">
                  Point your camera at the school QR code
                </p>
              </div>
              <button
                type="button"
                onClick={closeScanner}
                aria-label="Close scanner"
                className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              <div
                id="qr-reader"
                className="aspect-square w-full overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-950"
              />
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
