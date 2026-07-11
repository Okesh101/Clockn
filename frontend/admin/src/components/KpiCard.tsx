import { cn } from "../lib/utils";

const styles = {
  teachers: "bg-blue-50 text-blue-800 ring-blue-100",
  present: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  late: "bg-amber-50 text-amber-800 ring-amber-100",
  absent: "bg-red-50 text-red-800 ring-red-100",
  ontime: "bg-teal-50 text-teal-800 ring-teal-100",
} as const;

interface KpiCardProps {
  label: string;
  value: number | string;
  tone?: keyof typeof styles;
}

export function KpiCard({ label, value, tone = "teachers" }: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4 ring-1 sm:p-5",
        styles[tone],
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums sm:text-4xl">{value}</p>
    </div>
  );
}
