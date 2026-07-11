// src/components/auth/AuthLogo.tsx

import { Clock3, CheckCircle2 } from "lucide-react";

interface AuthLogoProps {
  portal?: string;
}

export default function AuthLogo({ portal = "Teacher Portal" }: AuthLogoProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Logo */}
      <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#0B2545] shadow-lg shadow-[#0B2545]/20 transition-all duration-300 hover:scale-105">
        <Clock3 size={34} strokeWidth={2.2} className="text-white" />

        <div className="absolute -right-1 -bottom-1 rounded-full bg-emerald-500 p-1 shadow-md">
          <CheckCircle2 size={16} strokeWidth={3} className="text-white" />
        </div>
      </div>

      {/* Product Name */}
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Clock'n
      </h1>

      {/* Portal */}
      <p className="mt-1 text-sm font-medium tracking-wide text-slate-500 uppercase">
        {portal}
      </p>
    </div>
  );
}