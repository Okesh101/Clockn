// import { cn } from "../lib/utils";

// const styles = {
//   teachers: "bg-blue-50 text-blue-800 ring-blue-100",
//   present: "bg-emerald-50 text-emerald-800 ring-emerald-100",
//   late: "bg-amber-50 text-amber-800 ring-amber-100",
//   absent: "bg-red-50 text-red-800 ring-red-100",
//   ontime: "bg-teal-50 text-teal-800 ring-teal-100",
// } as const;

// interface KpiCardProps {
//   label: string;
//   value: number | string;
//   tone?: keyof typeof styles;
// }

// export function KpiCard({ label, value, tone = "teachers" }: KpiCardProps) {
//   return (
//     <div
//       className={cn(
//         "rounded-2xl p-4 ring-1 sm:p-5",
//         styles[tone],
//       )}
//     >
//       <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
//         {label}
//       </p>
//       <p className="mt-2 text-3xl font-bold tabular-nums sm:text-4xl">{value}</p>
//     </div>
//   );
// }
import {
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "../lib/utils";

const styles = {
  teachers: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    ring: "ring-blue-100",
    iconBg: "bg-[#2563EB]",
  },
  present: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    ring: "ring-emerald-100",
    iconBg: "bg-[#16A34A]",
  },
  late: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    ring: "ring-amber-100",
    iconBg: "bg-[#D97706]",
  },
  absent: {
    bg: "bg-red-50",
    text: "text-red-800",
    ring: "ring-red-100",
    iconBg: "bg-[#DC2626]",
  },
  ontime: {
    bg: "bg-teal-50",
    text: "text-teal-800",
    ring: "ring-teal-100",
    iconBg: "bg-[#0D9488]",
  },
} as const;

const iconMap = {
  teachers: Users,
  present: UserCheck,
  late: Clock,
  absent: AlertCircle,
  ontime: CheckCircle2,
} as const;

interface KpiCardProps {
  label: string;
  value: number | string;
  tone?: keyof typeof styles;
}

export function KpiCard({ label, value, tone = "teachers" }: KpiCardProps) {
  const style = styles[tone];
  const Icon = iconMap[tone];

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 p-4 flex flex-col hover:shadow-sm transition-shadow",
        style.bg,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={cn(
            "w-7 h-7 rounded-full grid place-items-center shrink-0",
            style.iconBg,
            "text-white",
          )}
        >
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <p className={cn("text-[28px] font-extrabold leading-none", style.text)}>
        {value}
      </p>
    </div>
  );
}
