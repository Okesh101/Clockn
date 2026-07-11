// src/components/auth/AuthField.tsx

import type { ReactNode } from "react";
import { Label } from "../ui/Label";
import { Input } from "../ui/Input";

interface AuthFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AuthField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  icon,
  disabled,
  onChange,
}: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-sm font-medium text-slate-700"
      >
        {label}
      </Label>

      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}

        <Input
          id={id}
          type={type}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={onChange}
          className={`h-12 rounded-xl border-slate-300 focus:border-[#0B2545] ${
            icon ? "pl-11" : ""
          }`}
        />
      </div>
    </div>
  );
}