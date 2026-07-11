// src/components/auth/RegisterForm.tsx

import { Mail, Phone, User } from "lucide-react";

import AuthButton from "./AuthButton";
import AuthError from "./AuthError";
import AuthField from "./AuthField";
import PasswordInput from "./PasswordInput";

import type { AuthFormData } from "../../types/auth";

interface RegisterFormProps {
  form: AuthFormData;

  loading: boolean;

  error: string;

  updateField: (field: keyof AuthFormData, value: string) => void;

  onSubmit: (e: React.FormEvent) => void;
}

export default function RegisterForm({
  form,
  loading,
  error,
  updateField,
  onSubmit,
}: RegisterFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AuthField
          id="firstName"
          label="First Name"
          value={form.firstName}
          placeholder="John"
          disabled={loading}
          icon={<User size={18} />}
          onChange={(e) => updateField("firstName", e.target.value)}
        />

        <AuthField
          id="lastName"
          label="Last Name"
          value={form.lastName}
          placeholder="Doe"
          disabled={loading}
          icon={<User size={18} />}
          onChange={(e) => updateField("lastName", e.target.value)}
        />
      </div>

      <AuthField
        id="email"
        label="Email Address"
        type="email"
        value={form.email}
        placeholder="teacher@school.edu"
        disabled={loading}
        icon={<Mail size={18} />}
        onChange={(e) => updateField("email", e.target.value)}
      />

      <AuthField
        id="phone"
        label="Phone Number"
        type="tel"
        value={form.phone}
        placeholder="08012345678"
        disabled={loading}
        icon={<Phone size={18} />}
        onChange={(e) => updateField("phone", e.target.value)}
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
          onChange={(e) => updateField("password", e.target.value)}
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Confirm Password
        </label>

        <PasswordInput
          id="confirmPassword"
          value={form.confirmPassword}
          disabled={loading}
          placeholder="Re-enter your password"
          onChange={(e) => updateField("confirmPassword", e.target.value)}
        />
      </div>

      <AuthError message={error} />

      <AuthButton loading={loading}>Create Account</AuthButton>
    </form>
  );
}