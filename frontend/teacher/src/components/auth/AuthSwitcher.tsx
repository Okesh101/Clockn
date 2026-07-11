// src/components/auth/AuthSwitcher.tsx

import { motion } from "framer-motion";

interface Props {
  login: boolean;
  onToggle: () => void;
}

export default function AuthSwitcher({ login, onToggle }: Props) {
  return (
    <motion.div layout className="mt-8 text-center">
      <p className="text-sm text-slate-500">
        {login ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={onToggle}
          className="font-semibold text-[#0B2545] hover:underline"
        >
          {login ? "Create one" : "Sign In"}
        </button>
      </p>
    </motion.div>
  );
}
