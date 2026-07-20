// src/components/auth/AuthLogo.tsx

// import { Clock3, CheckCircle2 } from "lucide-react";

interface AuthLogoProps {
  portal?: string;
}

export default function AuthLogo({ portal = "Teacher Portal" }: AuthLogoProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Logo */}
      <img src="logo.png" alt="School Logo" className="h-28 w-30 m-3" />

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
