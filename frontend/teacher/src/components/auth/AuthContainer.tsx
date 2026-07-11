// src/components/auth/AuthContainer.tsx

import type { ReactNode } from "react";

interface AuthContainerProps {
  children: ReactNode;
}

export default function AuthContainer({ children }: AuthContainerProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B2545]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,122,64,0.22),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_38%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-5 py-10 sm:px-8">
        {children}
      </div>
    </main>
  );
}
