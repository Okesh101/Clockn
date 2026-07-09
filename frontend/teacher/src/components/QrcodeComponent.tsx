import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import api from "../utils/axiosConfig";

type QrAction = "in" | "out";

const getPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Your browser does not support GPS tracking."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
    });
  });

export const QrClockIn: React.FC = () => {
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [action, setAction] = useState<QrAction>("in");

  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop().catch((err) => console.error(err));
      }
    };
  }, []);

  const submitScan = async (qrString: string, mode: QrAction) => {
    setIsSubmitting(true);
    try {
      setStatusMessage("QR detected! Fetching GPS location...");
      const position = await getPosition();
      const { latitude, longitude } = position.coords;

      const payload =
        mode === "in"
          ? { qrString, timeInLat: latitude, timeInLng: longitude }
          : { qrString, timeOutLat: latitude, timeOutLng: longitude };

      setStatusMessage("Sending clock-in data to server...");
      const { data } = await api.post(`/attendance/qr/${mode}`, payload);
      setStatusMessage(
        `✅ ${data.message || (mode === "in" ? "Clock-in successful!" : "Clock-out successful!")}`,
      );
    } catch (error) {
      if (error instanceof AxiosError) {
        setStatusMessage(
          `❌ ${error.response?.data?.message || "Server error. Please try again."}`,
        );
      } else if (error instanceof Error) {
        setStatusMessage(`❌ ${error.message}`);
      } else {
        setStatusMessage("❌ Network error. Please try again.");
      }
      toast.error("QR attendance failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startScanner = async (mode: QrAction) => {
    setAction(mode);
    setIsScanning(true);
    setStatusMessage("Opening camera...");

    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        qrScannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            html5QrCode
              .stop()
              .then(() => {
                setIsScanning(false);
                submitScan(decodedText, mode);
              })
              .catch((err) => console.error(err));
          },
          () => {},
        );
        setStatusMessage("Align QR Code within the frame.");
      } catch (err) {
        console.error("Camera startup failed:", err);
        setStatusMessage("❌ Could not access camera permissions.");
        setIsScanning(false);
      }
    }, 150);
  };

  const closeScannerManually = async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      await qrScannerRef.current.stop();
    }
    setIsScanning(false);
    setStatusMessage("Scan cancelled.");
  };

  const busy = isScanning || isSubmitting;

  return (
    <div className="mx-auto max-w-md p-5 text-center">
      <h2 className="mb-4 text-xl font-bold text-gray-800">QR Attendance</h2>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => startScanner("in")}
          disabled={busy}
          className={`rounded-lg px-6 py-3 font-semibold shadow-md transition-all ${
            busy
              ? "cursor-not-allowed bg-gray-400 text-gray-200"
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
          }`}
        >
          {isSubmitting && action === "in" ? "Processing..." : "Scan to Clock In"}
        </button>
        <button
          onClick={() => startScanner("out")}
          disabled={busy}
          className={`rounded-lg border px-6 py-3 font-semibold transition-all ${
            busy
              ? "cursor-not-allowed border-gray-200 text-gray-300"
              : "border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95"
          }`}
        >
          {isSubmitting && action === "out" ? "Processing..." : "Scan to Clock Out"}
        </button>
      </div>

      {isScanning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4 transition-opacity">
          <div className="relative flex w-full max-w-sm flex-col items-center rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-800">
              Scan Attendance QR Code
            </h3>
            <div
              id="reader"
              className="aspect-square w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-100"
            />
            <button
              onClick={closeScannerManually}
              className="mt-4 rounded-md bg-red-100 px-4 py-2 font-medium text-red-600 hover:bg-red-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {statusMessage && (
        <p className="mt-5 rounded-lg border border-gray-100 bg-gray-50 p-3 text-base font-bold tracking-wide text-gray-700">
          {statusMessage}
        </p>
      )}
    </div>
  );
};
