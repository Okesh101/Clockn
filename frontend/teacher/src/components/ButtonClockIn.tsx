import React, { useState } from "react";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import api from "../utils/axiosConfig";

type Action = "in" | "out";

const getPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Browser does not support GPS."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
    });
  });

export const ButtonClockIn: React.FC = () => {
  const [loadingAction, setLoadingAction] = useState<Action | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [success, setSuccess] = useState<boolean | null>(null);

  const handleClock = async (action: Action) => {
    setLoadingAction(action);
    setSuccess(null);
    setStatusMessage("Acquiring high-accuracy location...");

    try {
      const position = await getPosition();
      const { latitude, longitude } = position.coords;

      const payload =
        action === "in"
          ? { timeInLat: latitude, timeInLng: longitude }
          : { timeOutLat: latitude, timeOutLng: longitude };

      setStatusMessage("Verifying campus proximity with server...");
      const { data } = await api.post(`/attendance/${action}`, payload);

      setSuccess(true);
      setStatusMessage(
        `✅ ${data.message || (action === "in" ? "Clocked in successfully!" : "Clocked out successfully!")}`,
      );
    } catch (error) {
      setSuccess(false);
      if (error instanceof AxiosError) {
        setStatusMessage(
          `❌ ${error.response?.data?.message || "Request failed. Check your connection."}`,
        );
      } else if (error instanceof GeolocationPositionError || error instanceof Error) {
        setStatusMessage(`❌ ${error.message || "Please grant GPS access."}`);
      } else {
        setStatusMessage("❌ Something went wrong. Please try again.");
      }
      toast.error("Attendance action failed.");
    } finally {
      setLoadingAction(null);
    }
  };

  const busy = loadingAction !== null;

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center justify-center rounded-2xl bg-white p-6">
      <h2 className="mb-1 text-center text-xl font-bold text-gray-800">
        Button Attendance
      </h2>
      <p className="mb-8 text-center text-xs text-gray-500">
        Make sure you are physically within the school premises boundaries.
      </p>

      <div className="relative flex h-52 w-52 items-center justify-center">
        {!busy && success !== true && (
          <div className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-blue-400/20" />
        )}

        <button
          onClick={() => handleClock("in")}
          disabled={busy}
          className={`flex h-48 w-48 select-none items-center justify-center rounded-full border-4 p-4 text-center text-lg font-bold tracking-wide shadow-xl transition-all ${
            loadingAction === "in"
              ? "animate-pulse cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400"
              : success === true
                ? "border-emerald-600 bg-emerald-500 text-white shadow-emerald-200 active:scale-95"
                : success === false
                  ? "border-red-600 bg-red-500 text-white shadow-red-200 active:scale-95"
                  : "border-blue-700 bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 hover:shadow-2xl active:scale-95"
          }`}
        >
          {loadingAction === "in" ? "Processing..." : "Click to Clock-in"}
        </button>
      </div>

      <button
        onClick={() => handleClock("out")}
        disabled={busy}
        className="mt-8 w-full rounded-xl border border-gray-200 bg-white py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loadingAction === "out" ? "Processing..." : "Clock Out"}
      </button>

      {statusMessage && (
        <div
          className={`mt-6 w-full rounded-xl border p-3 text-center text-sm font-semibold transition-all ${
            success === true
              ? "border-emerald-100 bg-emerald-50 text-emerald-800"
              : success === false
                ? "border-red-100 bg-red-50 text-red-800"
                : "border-gray-100 bg-gray-50 text-gray-700"
          }`}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
};
