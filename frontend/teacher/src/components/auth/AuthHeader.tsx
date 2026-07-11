// src/components/auth/AuthHeader.tsx

import AuthLogo from "./AuthLogo";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
  portal?: string;
}

export default function AuthHeader({
  title,
  subtitle,
  portal,
}: AuthHeaderProps) {
  return (
    <div className="space-y-6 text-center">
      <AuthLogo portal={portal} />

      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>

        <p className="mx-auto max-w-sm text-sm leading-6 text-slate-500">
          {subtitle}
        </p>
      </div>
    </div>
  );
}