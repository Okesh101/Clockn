// src/components/auth/AuthCard.tsx

import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface AuthCardProps {
  children: ReactNode;
}

export default function AuthCard({ children }: AuthCardProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
      }}
      className="
        w-full
        max-w-md
        rounded-3xl
        bg-white
        p-8
        shadow-2xl
        shadow-black/20
      "
    >
      {children}
    </motion.div>
  );
}
