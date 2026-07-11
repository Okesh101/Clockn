import { useEffect, useState } from "react";

export type AttendanceAction = "in" | "out";

/** Clock-in window: 12:00 AM – 3:59 PM. From 4:00 PM onward, clock-out. */
export function getAttendanceAction(date = new Date()): AttendanceAction {
  return date.getHours() < 16 ? "in" : "out";
}

function msUntilNextTransition(from = new Date()) {
  const next = new Date(from);

  if (from.getHours() < 16) {
    next.setHours(16, 0, 0, 0);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
  }

  return Math.max(next.getTime() - from.getTime(), 1000);
}

export function useAttendanceMode() {
  const [action, setAction] = useState<AttendanceAction>(() =>
    getAttendanceAction(),
  );

  useEffect(() => {
    const sync = () => setAction(getAttendanceAction());

    sync();

    let timeoutId = window.setTimeout(function tick() {
      sync();
      timeoutId = window.setTimeout(tick, msUntilNextTransition());
    }, msUntilNextTransition());

    const intervalId = window.setInterval(sync, 60_000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  const isClockIn = action === "in";

  return {
    action,
    isClockIn,
    tapLabel: isClockIn ? "Tap to CLOCK-IN" : "Tap to CLOCK-OUT",
    scanLabel: isClockIn ? "Scan to Clock-in" : "Scan to Clock-out",
  };
}
