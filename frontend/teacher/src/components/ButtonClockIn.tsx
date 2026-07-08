import React, { useState } from "react";

export const ButtonClockIn: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [success, setSuccess] = useState<boolean | null>(null);

  const handleButtonClockIn = () => {
    if (!navigator.geolocation) {
      setStatusMessage("❌ Error: Browser does not support GPS.");
      return;
    }

    setLoading(true);
    setSuccess(null);
    setStatusMessage("Acquiring high-accuracy location...");

    // 1. Grab coordinates instantly when clicked
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const payload = {
          timeInLat: position.coords.latitude,
          timeInLng: position.coords.longitude,
        };

        setStatusMessage("Verifying campus proximity with server...");

        try {
          // 2. Fire request directly to your button endpoint route
          const response = await fetch("/api/v1/attendance/in", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json();

          if (response.ok) {
            setSuccess(true);
            setStatusMessage(
              `✅ ${data.message || "Clocked in successfully!"}`,
            );
          } else {
            setSuccess(false);
            setStatusMessage(`❌ Failed: ${data.message || "Proximity error"}`);
          }
        } catch (error) {
          setSuccess(false);
          setStatusMessage(
            "❌ Network error. Please verify server connection.",
          );
        } finally {
          setLoading(false);
        }
      },
      () => {
        setSuccess(false);
        setLoading(false);
        setStatusMessage(
          "❌ Error: Please grant GPS location access to clock in.",
        );
      },
      { enableHighAccuracy: true }, // Ensures highly accurate metrics for your 120m check
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 max-w-sm mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 mt-10">
      <h2 className="text-xl font-bold text-gray-800 text-center mb-1">
        School Attendance
      </h2>
      <p className="text-xs text-gray-500 mb-8 text-center">
        Make sure you are physically within the school premises boundaries.
      </p>

      {/* 3. The Interactive Big Circle Button Container */}
      <div className="relative flex items-center justify-center w-52 h-52">
        {/* Pulsing Outer Ring (Animating when idle) */}
        {!loading && !success && (
          <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping pointer-events-none"></div>
        )}

        <button
          onClick={handleButtonClockIn}
          disabled={loading}
          className={`w-48 h-48 rounded-full font-bold text-lg tracking-wide transition-all shadow-xl flex items-center justify-center border-4 text-center p-4 select-none ${
            loading
              ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed animate-pulse"
              : success === true
                ? "bg-emerald-500 border-emerald-600 text-white shadow-emerald-200 active:scale-95"
                : success === false
                  ? "bg-red-500 border-red-600 text-white shadow-red-200 active:scale-95"
                  : "bg-blue-600 border-blue-700 text-white hover:bg-blue-700 shadow-blue-200 active:scale-95 hover:shadow-2xl"
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-normal">Processing</span>
              <span className="text-sm font-semibold">Please Wait...</span>
            </div>
          ) : success === true ? (
            "Clocked In! 🎉"
          ) : success === false ? (
            "Try Again 🔄"
          ) : (
            "Click to Clock-in"
          )}
        </button>
      </div>

      {/* 4. Real-time Status Log Outputs */}
      {statusMessage && (
        <div
          className={`mt-8 w-full p-3 rounded-xl border text-sm font-semibold text-center transition-all ${
            success === true
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : success === false
                ? "bg-red-50 border-red-100 text-red-800"
                : "bg-gray-50 border-gray-100 text-gray-700"
          }`}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
};
