// src/components/auth/AuthError.tsx

import { AlertCircle } from "lucide-react";

interface Props {
  message?: string;
}

export default function AuthError({ message }: Props) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <AlertCircle className="mt-0.5 shrink-0 text-red-500" size={18} />

      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}
