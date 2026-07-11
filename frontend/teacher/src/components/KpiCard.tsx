import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "./ui/Icon";

export interface KpiData {
  icon: IconName;
  iconBg: string;
  iconColor: string;
  label: string;
  value: ReactNode;
  valueColor?: string;
  sub?: ReactNode;
  subColor?: string;
  risk?: boolean;
  badge?: ReactNode;
}

export function KpiCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  valueColor,
  sub,
  subColor,
  risk,
  badge,
}: KpiData) {
  const cardStyle: CSSProperties | undefined = risk
    ? { border: "1px solid #f3c4c4" }
    : undefined;
  return (
    <div className="dcc-card dcc-kpi" style={cardStyle}>
      <div className="ktop">
        <div className="kic" style={{ background: iconBg, color: iconColor }}>
          <Icon name={icon} size={20} />
        </div>
        <div className="kk">{label}</div>
      </div>
      <div className="kv" style={{ color: risk ? "#dc2b2b" : valueColor }}>
        {value}
      </div>
      {badge}
      {sub && (
        <div className="ksub" style={{ color: subColor }}>
          {sub}
        </div>
      )}
    </div>
  );
}
