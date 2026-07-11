// src/components/auth/PasswordInput.tsx

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

import { Input } from "../ui/Input";

interface PasswordInputProps {
  id: string;
  placeholder?: string;
  value: string;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PasswordInput({
  id,
  placeholder = "Enter your password",
  value,
  disabled,
  onChange,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Lock
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="h-12 rounded-xl border-slate-300 pl-11 pr-12 focus:border-[#0B2545]"
      />

      <button
        type="button"
        onClick={() => setShowPassword((v) => !v)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
