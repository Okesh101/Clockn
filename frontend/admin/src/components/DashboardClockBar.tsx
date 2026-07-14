import { CalendarDays, Clock3 } from "lucide-react";

import { useLiveClock } from "../hooks/useLiveClock";

export function DashboardClockBar() {
  const { hours, minutes, seconds, period, dateLabel } = useLiveClock();

  return (
    <div
      className="border-b border-[#0B2545]/10 bg-white/90 backdrop-blur-md"
      aria-live="polite"
      aria-label="Current date and time"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 text-[#0B2545]">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0B2545]/8">
            <CalendarDays className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0B2545]/60">
              Today
            </p>
            <p className="truncate text-sm font-bold sm:text-base">
              {dateLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="hidden h-10 w-px bg-[#0B2545]/15 sm:block" />
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
            <Clock3 className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div className="tabular-nums text-[#0B2545]">
            <div className="flex flex-wrap items-baseline gap-x-0.5 gap-y-0">
              <span className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                {hours}:{minutes}
              </span>
              <span className="text-lg font-semibold text-[#0B2545]/50 sm:text-xl lg:text-2xl">
                :{seconds}
              </span>
              <span className="ml-1 text-sm font-bold uppercase tracking-wide text-[#0B2545]/70 sm:ml-2 sm:text-base">
                {period}
              </span>
            </div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#0B2545]/50">
              Live school time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
