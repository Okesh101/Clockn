// src/pages/Auth.tsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { RegisterPayload } from "../types";
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

type Mode = "signin" | "signup";

interface FormState {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  password: string;
}

const emptyForm: FormState = {
  firstname: "",
  lastname: "",
  email: "",
  phone: "",
  password: "",
};

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || "/";

  const isSignup = mode === "signup";

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setErrors({});
    setShowPassword(false);
  };

  const update =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!form.email) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      next.email = "Enter a valid email address";

    if (!form.password) next.password = "Password is required";
    else if (isSignup && form.password.length < 6)
      next.password = "Password must be at least 6 characters";

    if (isSignup) {
      if (!form.firstname) next.firstname = "First name is required";
      if (!form.lastname) next.lastname = "Last name is required";
      if (!form.phone) next.phone = "Phone number is required";
      else if (!/^\d{11}$/.test(form.phone))
        next.phone = "Phone must be exactly 11 digits";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isSignup) {
        const payload: RegisterPayload = {
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        };
        await register(payload);
      } else {
        await login(form.email.trim(), form.password);
      }
      navigate(from, { replace: true });
    } catch {
      // Errors surface via toast in the auth context.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-300/40 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-purple-300/40 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-pink-300/40 blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="glass-card p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="gradient-text text-3xl font-bold mb-1">
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-gray-500">
              {isSignup
                ? "Join Clockn to start marking attendance"
                : "Sign in to mark your attendance"}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="relative mb-8 grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-sm font-semibold">
            <span
              className={`absolute inset-y-1 w-1/2 rounded-lg bg-white shadow transition-transform duration-300 ease-out ${
                isSignup ? "translate-x-full" : "translate-x-0"
              }`}
              aria-hidden
            />
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`relative z-10 py-2 transition-colors ${
                !isSignup ? "text-indigo-600" : "text-gray-500"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`relative z-10 py-2 transition-colors ${
                isSignup ? "text-indigo-600" : "text-gray-500"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sign up only: names + phone with smooth reveal */}
            <div
              className={`grid transition-all duration-500 ease-in-out ${
                isSignup
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-4 pb-1">
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      icon={<User className="field-icon" />}
                      placeholder="First name"
                      value={form.firstname}
                      onChange={update("firstname")}
                      error={errors.firstname}
                      autoComplete="given-name"
                    />
                    <Field
                      icon={<User className="field-icon" />}
                      placeholder="Last name"
                      value={form.lastname}
                      onChange={update("lastname")}
                      error={errors.lastname}
                      autoComplete="family-name"
                    />
                  </div>
                  <Field
                    icon={<Phone className="field-icon" />}
                    placeholder="Phone (11 digits)"
                    value={form.phone}
                    onChange={update("phone")}
                    error={errors.phone}
                    inputMode="numeric"
                    maxLength={11}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            <Field
              icon={<Mail className="field-icon" />}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update("email")}
              error={errors.email}
              autoComplete="email"
            />

            <div>
              <div className="relative">
                <Lock className="field-icon left-3 absolute top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={update("password")}
                  placeholder="Password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  className={`glass-input w-full pl-10 pr-10 ${
                    errors.password ? "border-red-400" : ""
                  }`}
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="glass-button mt-2 flex w-full items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  {isSignup ? "Create account" : "Sign in"}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(isSignup ? "signin" : "signup")}
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

interface FieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  error?: string;
}

const Field: React.FC<FieldProps> = ({ icon, error, className = "", ...rest }) => (
  <div>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
      <input
        {...rest}
        className={`glass-input w-full pl-10 ${
          error ? "border-red-400" : ""
        } ${className}`}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

export default Auth;
