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

  const ringClass = isClockIn
    ? "border-[#0B2545] shadow-[#0B2545]/25"
    : "border-amber-600 shadow-amber-500/25";

  const buttonClass = isClockIn
    ? "bg-[#0B2545] hover:bg-[#12345c]"
    : "bg-amber-600 hover:bg-amber-700";

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-[min(72vw,17rem)] w-[min(72vw,17rem)] items-center justify-center">
        {state === "idle" && (
          <>
            <span
              aria-hidden
              className={`absolute inset-0 animate-ping rounded-full border-2 opacity-20 ${ringClass}`}
            />
            <span
              aria-hidden
              className={`absolute inset-3 animate-pulse rounded-full border opacity-30 ${ringClass}`}
            />
          </>
        )}

        <button
          type="button"
          onClick={handleClock}
          disabled={busy}
          aria-label={label}
          className={`relative z-10 flex h-[min(64vw,15rem)] w-[min(64vw,15rem)] select-none flex-col items-center justify-center rounded-full border-4 border-white/20 text-center text-white shadow-2xl transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed ${buttonClass} ${
            state === "success"
              ? "!bg-emerald-600 !shadow-emerald-500/30"
              : state === "error"
                ? "!bg-red-600 !shadow-red-500/30"
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
            <span className="px-6 text-base font-bold uppercase leading-snug tracking-wide sm:text-lg">
              {label}
            </span>
          )}
        </button>
      </div>

      {message && (
        <p
          role="status"
          className={`mt-5 max-w-xs text-center text-sm font-medium ${
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
