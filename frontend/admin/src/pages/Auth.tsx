import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Clock3, Loader2, Mail } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuthForm } from "../hooks/useAuthForm";
import { useAuth } from "../contexts/AuthContext";
import { Button, Input, Label } from "../components/ui/form";

function PasswordInput({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder="Enter your password"
        className="pr-16"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#0B2545]/60"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const e = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return e.response?.data?.message || e.message || fallback;
  }
  return fallback;
};

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const {
    form,
    loading,
    setLoading,
    error,
    setError,
    clearError,
    updateField,
    validateLogin,
    getLoginPayload,
  } = useAuthForm();

  const fromPath =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || "/";

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(fromPath, { replace: true });
    }
  }, [authLoading, fromPath, isAuthenticated, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    const validation = validateLogin();
    if (!validation.valid) {
      setError(validation.message ?? "Please check your details.");
      return;
    }

    setLoading(true);
    try {
      const { email, password } = getLoginPayload();
      await login(email, password);
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || authLoading;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B2545]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,122,64,0.22),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_38%)]"
      />
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-black/20"
        >
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#0B2545] shadow-lg">
              <Clock3 className="h-9 w-9 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#0B2545]">Clock'n</h1>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Admin Portal
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Admin sign in</h2>
              <p className="mt-1 text-sm text-slate-500">
                Secure access to attendance management
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  disabled={busy}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="admin@school.edu"
                  className="pl-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                value={form.password}
                disabled={busy}
                onChange={(e) => updateField("password", e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="h-12 w-full bg-[#0B2545] text-white hover:bg-[#12345c]"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Please wait…
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </main>
  );
}

export default AuthPage;
