import { useState } from "react";
import { AxiosError } from "axios";
import { CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import type { AttendanceAction } from "../hooks/useAttendanceMode";
import api from "../utils/axiosConfig";
import { getPosition } from "../utils/geolocation";

interface ButtonClockInProps {
  action: AttendanceAction;
  label: string;
}

type SubmitState = "idle" | "loading" | "success" | "error";

export function ButtonClockIn({ action, label }: ButtonClockInProps) {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  const isClockIn = action === "in";
  const busy = state === "loading";

  const handleClock = async () => {
    if (busy) return;

    setState("loading");
    setMessage("Getting your location…");

    try {
      const position = await getPosition();
      const { latitude, longitude } = position.coords;

      const payload = isClockIn
        ? { timeInLat: latitude, timeInLng: longitude }
        : { timeOutLat: latitude, timeOutLng: longitude };

      setMessage("Verifying campus proximity…");
      const { data } = await api.post(`/attendance/${action}`, payload);

      const successMessage =
        data.message ||
        (isClockIn
          ? "Clocked in successfully."
          : "Clocked out successfully.");

      setState("success");
      setMessage(successMessage);
      toast.success(successMessage);

      window.setTimeout(() => {
        setState("idle");
        setMessage("");
      }, 3500);
    } catch (error) {
      setState("error");

      let errorMsg = "Something went wrong. Please try again.";
      if (error instanceof AxiosError) {
        errorMsg =
          error.response?.data?.message ||
          "Request failed. Check your connection.";
      } else if (
        error instanceof GeolocationPositionError ||
        error instanceof Error
      ) {
        errorMsg = error.message || "Please grant GPS access.";
      }

      setMessage(errorMsg);
      toast.error(errorMsg);
    }
  };

  const buttonClass = isClockIn
    ? "bg-[#0B2545] shadow-[0_20px_50px_-16px_rgba(11,37,69,0.55)] hover:bg-[#12345c]"
    : "bg-amber-600 shadow-[0_20px_50px_-16px_rgba(217,119,6,0.45)] hover:bg-amber-700";

  const ringClass = isClockIn
    ? "ring-[#0B2545]/20"
    : "ring-amber-500/25";

  return (
    <div className="flex flex-col items-center">
      <div className="flex h-60 w-60 shrink-0 items-center justify-center sm:h-64 sm:w-64">
        <button
          type="button"
          onClick={handleClock}
          disabled={busy}
          aria-label={label}
          className={`flex h-52 w-52 shrink-0 select-none flex-col items-center justify-center rounded-full border-4 border-white/25 text-center text-white ring-8 cursor-pointer transition-[transform,background-color,box-shadow] duration-200 active:scale-[0.97] disabled:cursor-not-allowed sm:h-56 sm:w-56 ${ringClass} ${buttonClass} ${
            state === "success"
              ? "!bg-emerald-600 !shadow-[0_20px_50px_-16px_rgba(5,150,105,0.45)] !ring-emerald-500/25"
              : state === "error"
                ? "!bg-red-600 !shadow-[0_20px_50px_-16px_rgba(220,38,38,0.45)] !ring-red-500/25"
                : ""
          }`}
        >
          {busy ? (
            <>
              <Loader2 className="mb-2 h-8 w-8 animate-spin" />
              <span className="px-4 text-sm font-semibold">Processing…</span>
            </>
          ) : state === "success" ? (
            <>
              <CheckCircle2 className="mb-2 h-9 w-9" strokeWidth={2.2} />
              <span className="px-4 text-sm font-bold uppercase tracking-wide">
                Done
              </span>
            </>
          ) : (
            <span className="px-5 text-base font-bold uppercase leading-snug tracking-wide sm:text-lg">
              {label}
            </span>
          )}
        </button>
      </div>

      {message && (
        <p
          role="status"
          className={`mt-5 max-w-sm text-center text-sm font-medium ${
            state === "success"
              ? "text-emerald-700"
              : state === "error"
                ? "text-red-700"
                : "text-slate-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
