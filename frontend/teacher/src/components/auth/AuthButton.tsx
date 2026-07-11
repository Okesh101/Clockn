// src/components/auth/AuthButton.tsx

import { Loader2 } from "lucide-react";
import { Button } from "../ui/Button";

interface Props {
  loading?: boolean;
  children: React.ReactNode;
}

export default function AuthButton({ loading, children }: Props) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className="
      h-12
      w-full
      rounded-xl
      bg-[#0B2545]
      text-white
      transition-all
      duration-300
      hover:bg-[#12345c]
      hover:shadow-lg
      active:scale-[0.98]
      "
    >
      {loading ? (
        <>
          <Loader2 size={18} className="mr-2 animate-spin" />
          Please wait...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
