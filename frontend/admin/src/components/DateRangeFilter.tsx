import type { AttendanceRange } from "../types/attendance";

const OPTIONS: { value: AttendanceRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom" },
];

interface DateRangeFilterProps {
  value: AttendanceRange;
  onChange: (value: AttendanceRange) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

export function DateRangeFilter({
  value,
  onChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AttendanceRange)}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0B2545] outline-none focus:border-[#0B2545] focus:ring-2 focus:ring-[#0B2545]/10"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {value === "custom" && (
        <>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0B2545]"
          />
          <span className="text-sm text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0B2545]"
          />
        </>
      )}
    </div>
  );
}
