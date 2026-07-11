import { useEffect, useState } from "react";

function formatHeaderTime(date: Date) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return {
    time: `${hours}:${minutes}`,
    seconds,
    period,
    full: `${hours}:${minutes}:${seconds} ${period}`,
  };
}

export function useLiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return {
    now,
    ...formatHeaderTime(now),
  };
}
