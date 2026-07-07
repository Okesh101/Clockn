import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface ClockInPayload {
  qrString: string;
  lat: number;
  lng: number;
}

export const QrClockIn: React.FC = () => {
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      // Force kill the camera tracking if the user navigates away mid-scan
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop().catch((err) => console.error(err));
      }
    };
  }, []);

  const startInstantScanner = async () => {
    setIsScanning(true);
    setStatusMessage("Opening camera...");

    // Wait a brief tick for the modal element to inject into the DOM
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        qrScannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            setStatusMessage("QR detected! Fetching GPS location...");

            // 1. Instantly shut off the camera stream and close the modal overlay
            html5QrCode
              .stop()
              .then(() => {
                setIsScanning(false);
                setIsSubmitting(true); // Disable the main trigger button during processing
                getUserGpsAndSubmit(decodedText);
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

  const getUserGpsAndSubmit = (qrStringID: string) => {
    if (!navigator.geolocation) {
      setStatusMessage("Error: Your browser does not support GPS tracking.");
      setIsSubmitting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const payload: ClockInPayload = {
          qrString: qrStringID,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setStatusMessage("Sending clock-in data to server...");

        try {
          const response = await fetch("/api/v1/qrcode/test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const data = await response.json();

          if (response.ok) {
            setStatusMessage("✅ Clock-in successful!");
          } else {
            setStatusMessage(`❌ Failed: ${data.message || "Server error"}`);
          }
        } catch (error) {
          setStatusMessage("❌ Network error. Please try again.");
        } finally {
          setIsSubmitting(false); // Enable the action button again once response returns
        }
      },
      () => {
        setStatusMessage("❌ Error: You must allow GPS access to clock in.");
        setIsSubmitting(false);
      },
    );
  };

  return (
    <div className="p-5 text-center max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Attendance Clock-In</h2>

      {/* Main Trigger Button: Disabled when scanning or fetching location API responses */}
      <button
        onClick={startInstantScanner}
        disabled={isScanning || isSubmitting}
        className={`px-6 py-3 font-semibold rounded-lg shadow-md transition-all ${
          isSubmitting || isScanning
            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
        }`}
      >
        {isSubmitting ? "Processing..." : "Scan to Clock In"}
      </button>

      {/* Popup Modal Base */}
      {isScanning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4 transition-opacity">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm flex flex-col items-center relative shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Scan Attendance QR Code
            </h3>

            {/* The active camera box inside our frame structure */}
            <div
              id="reader"
              className="w-full h-110 aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300"
            ></div>

            {/* Manual exit option */}
            <button
              onClick={closeScannerManually}
              className="mt-4 px-4 py-2 bg-red-100 text-red-600 font-medium rounded-md hover:bg-red-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Real-time workflow notifications */}
      {statusMessage && (
        <p className="mt-5 font-bold text-base text-gray-700 tracking-wide bg-gray-50 p-3 rounded-lg border border-gray-100">
          {statusMessage}
        </p>
      )}
    </div>
  );
};
