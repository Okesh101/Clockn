// src/components/KpiCard.tsx

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
    icon: Users,
  },
  present: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    ring: "ring-emerald-100",
    iconBg: "bg-[#16A34A]",
    icon: UserCheck,
  },
  late: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    ring: "ring-amber-100",
    iconBg: "bg-[#D97706]",
    icon: Clock,
  },
  absent: {
    bg: "bg-red-50",
    text: "text-red-800",
    ring: "ring-red-100",
    iconBg: "bg-[#DC2626]",
    icon: AlertCircle,
  },
  ontime: {
    bg: "bg-teal-50",
    text: "text-teal-800",
    ring: "ring-teal-100",
    iconBg: "bg-[#0D9488]",
    icon: CheckCircle2,
  },
} as const;

interface KpiCardProps {
  label: string;
  value: number | string;
  tone?: keyof typeof styles;
}

export function KpiCard({ label, value, tone = "teachers" }: KpiCardProps) {
  const style = styles[tone];
  const Icon = style.icon;

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

export default KpiCard;
