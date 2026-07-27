// src/components/RequestClockOutModal.tsx
import { useState, useEffect } from "react";
import { X, Send, Loader2, AlertCircle, Navigation, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { requestClockOut } from "../services/requestApi";
import { cn } from "../lib/utils";

interface RequestClockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RequestClockOutModal({
  isOpen,
  onClose,
  onSuccess,
}: RequestClockOutModalProps) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update time every minute
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const getLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setLocationError(null);

    try {
      // Always get location - backend will decide if it's needed
      const position = await getLocation();
      const { latitude, longitude } = position.coords;

      // Submit request with location
      await requestClockOut(note || undefined, latitude, longitude);

      toast.success("Clock-out request submitted successfully!");
      setNote("");
      onClose();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      // Handle location errors
      if (error.message === "Geolocation is not supported by your browser") {
        setLocationError(
          "Your browser doesn't support location services. Please use a modern browser.",
        );
        toast.error("Location services not supported");
      } else if (error.code === 1) {
        setLocationError(
          "Location access denied. Please enable location services and try again.",
        );
        toast.error("Location access required");
      } else if (error.code === 2) {
        setLocationError(
          "Unable to detect your location. Please check your GPS and try again.",
        );
        toast.error("Location unavailable");
      } else if (error.code === 3) {
        setLocationError("Location request timed out. Please try again.");
        toast.error("Location request timed out");
      } else {
        const message =
          error.response?.data?.message || "Failed to submit request";
        setLocationError(message);
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Get current time info
  const now = currentTime;
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const isBefore4PM = hours < 16 || (hours === 16 && minutes === 0);

  const formattedTime = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const getTimeBasedContent = () => {
    if (isBefore4PM) {
      return {
        title: "Request Early Clock-Out",
        badge: "Before 4:00 PM",
        badgeColor: "bg-blue-50 text-blue-800",
        iconColor: "text-blue-600",
        message: `You are requesting to clock out at ${formattedTime}, before the official end of school hours (4:00 PM). This request will be sent to the admin for approval.`,
        showLocation: true,
        buttonText: "Submit Request",
      };
    } else {
      return {
        title: "Request Clock-Out",
        badge: "After 4:00 PM",
        badgeColor: "bg-emerald-50 text-emerald-800",
        iconColor: "text-emerald-600",
        message: `You are requesting to clock out at ${formattedTime}. Since it's after 4:00 PM, you can clock out directly without admin approval, except you've left the school premises.`,
        showLocation: false,
        buttonText: "Clock Out Now",
      };
    }
  };

  const content = getTimeBasedContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-[#0B2545]">
            {content.title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Time Badge */}
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold",
                  content.badgeColor,
                )}
              >
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {content.badge}
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-500">
                {formattedTime}
              </span>
            </div>

            {/* Info Box */}
            <div
              className={cn(
                "rounded-xl p-3 sm:p-4 text-sm",
                isBefore4PM
                  ? "bg-blue-50 text-blue-800"
                  : "bg-emerald-50 text-emerald-800",
              )}
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0",
                    isBefore4PM ? "text-blue-600" : "text-emerald-600",
                  )}
                />
                <div>
                  <p className="font-semibold text-xs sm:text-sm">
                    {isBefore4PM
                      ? "Admin Approval Required"
                      : "Direct Clock-Out"}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xs sm:text-sm",
                      isBefore4PM ? "text-blue-700" : "text-emerald-700",
                    )}
                  >
                    {content.message}
                  </p>
                  {content.showLocation && (
                    <p className="text-blue-600 mt-2 text-xs flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      Your location will be verified to confirm you're at school
                    </p>
                  )}
                </div>
              </div>
            </div>

            {locationError && (
              <div className="bg-red-50 rounded-xl p-3 text-sm text-red-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>{locationError}</span>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="note"
                className="text-sm font-semibold text-[#0B2545]"
              >
                Reason (Optional)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Medical appointment, emergency, etc."
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:border-[#0B2545] focus:outline-none resize-none cursor-text"
                rows={4}
                maxLength={500}
              />
              <p className="mt-1.5 text-xs text-slate-500 text-right">
                {note.length}/500 characters
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-10 bg-[#0B2545] text-white rounded-xl hover:bg-[#1a3a5c] transition-colors disabled:opacity-50 font-semibold flex items-center justify-center text-sm cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {content.buttonText}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 bg-white text-[#0B2545] ring-1 ring-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-sm cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
