// src/components/auth/LoginForm.tsx

import { Mail } from "lucide-react";

import AuthButton from "./AuthButton";
import AuthError from "./AuthError";
import AuthField from "./AuthField";
import PasswordInput from "./PasswordInput";

import type { AuthFormData } from "../../types/auth";

interface LoginFormProps {
  form: AuthFormData;
  loading: boolean;
  error: string;

  updateField: (field: keyof AuthFormData, value: string) => void;

  onSubmit: (e: React.FormEvent) => void;
}

export default function LoginForm({
  form,
  loading,
  error,
  updateField,
  onSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <AuthField
        id="email"
        label="Email Address"
        type="email"
        placeholder="teacher@school.edu"
        value={form.email}
        disabled={loading}
        icon={<Mail size={18} />}
        onChange={(e) => updateField("email", e.target.value)}
      />

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Password
        </label>

        <PasswordInput
          id="password"
          value={form.password}
          disabled={loading}
          onChange={(e) => updateField("password", e.target.value)}
        />
      </div>

      <AuthError message={error} />

      <AuthButton loading={loading}>Sign In</AuthButton>
    </form>
  );
}
