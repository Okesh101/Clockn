import { useEffect, useState } from "react";

function formatClock(date: Date) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  const weekday = date.toLocaleDateString([], { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString([], { month: "short" });
  const year = date.getFullYear();

  return {
    hours: String(hours),
    minutes,
    seconds,
    period,
    dateLabel: `${weekday}, ${day} ${month} ${year}`,
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
    ...formatClock(now),
  };
}
