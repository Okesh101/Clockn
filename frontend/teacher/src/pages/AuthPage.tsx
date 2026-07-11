import React, { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  AtSign,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Phone,
  School,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

type AuthMode = "login" | "register";

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, loading } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const fromPath =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || "/";

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(fromPath, { replace: true });
    }
  }, [fromPath, isAuthenticated, loading, navigate]);

  const handleModeToggle = (newMode: AuthMode) => {
    if (newMode === mode) return;
    setMode(newMode);
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(loginData.email.trim(), loginData.password);
      navigate(fromPath, { replace: true });
    } catch {
      // Errors are surfaced via toast from the auth context.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await register({
        firstname: registerData.firstName.trim(),
        lastname: registerData.lastName.trim(),
        email: registerData.email.trim(),
        phone: registerData.phone.trim(),
        password: registerData.password,
      });
      navigate(fromPath, { replace: true });
    } catch {
      // Errors are surfaced via toast from the auth context.
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoginDisabled =
    isSubmitting || !loginData.email.trim() || !loginData.password;
  const isRegisterDisabled =
    isSubmitting ||
    !registerData.firstName.trim() ||
    !registerData.lastName.trim() ||
    !registerData.email.trim() ||
    !registerData.phone.trim() ||
    !registerData.password ||
    !registerData.confirmPassword ||
    registerData.password !== registerData.confirmPassword;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.16),_transparent_40%),linear-gradient(135deg,_#f8fafc_0%,_#eef4ff_100%)] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/90 shadow-[0_30px_90px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="grid lg:grid-cols-[1.02fr_0.98fr]">
            <div className="relative overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.25),_transparent_40%),linear-gradient(135deg,_rgba(11,37,69,0.95)_0%,_rgba(15,23,42,1)_100%)]" />
              <div className="absolute -right-16 top-12 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
              <div className="absolute bottom-0 left-8 h-24 w-24 rounded-full bg-cyan-400/20 blur-3xl" />

              <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium text-slate-200 backdrop-blur">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    Mobile-first attendance portal
                  </div>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/20">
                      <School className="h-6 w-6 text-amber-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                        CMS Grammar School
                      </p>
                      <p className="text-lg font-semibold text-white">
                        Secure and elegant teacher access
                      </p>
                    </div>
                  </div>
                  <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl">
                    Clock in with confidence from any device.
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                    A polished entry point for teachers to sign in, register,
                    and head straight into attendance with tap-to-clock and QR
                    scanning.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    "Protected, school-ready sign-in experience",
                    "Designed for phones first, with desktop polish",
                    "Instant access to button and QR attendance",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100 backdrop-blur"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <ShieldCheck className="h-4 w-4" />
                    Secure access for every teacher
                  </div>
                  <p className="mt-2 text-amber-50/90">
                    Use your school credentials to keep attendance simple, fast,
                    and dependable.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <div className="mx-auto flex max-w-md flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">
                      Teacher portal
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">
                      {mode === "login"
                        ? "Welcome back"
                        : "Create your account"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {mode === "login"
                        ? "Continue to clock in or out in seconds."
                        : "Join the school attendance workflow in a few taps."}
                    </p>
                  </div>
                  <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    Secure
                  </div>
                </div>

                <div className="flex rounded-full bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => handleModeToggle("login")}
                    className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                      mode === "login"
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeToggle("register")}
                    className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                      mode === "register"
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Register
                  </button>
                </div>

                {mode === "login" ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <label className="block space-y-2">
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <AtSign className="h-4 w-4 text-amber-500" />
                        Email address
                      </span>
                      <input
                        type="email"
                        name="email"
                        value={loginData.email}
                        onChange={handleLoginChange}
                        placeholder="teacher@cmsgrammar.edu"
                        disabled={isSubmitting || loading}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Lock className="h-4 w-4 text-amber-500" />
                        Password
                      </span>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={loginData.password}
                          onChange={handleLoginChange}
                          placeholder="Enter your password"
                          disabled={isSubmitting || loading}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-700"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={isLoginDisabled}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Signing in..." : "Sign in"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block space-y-2">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <UserRound className="h-4 w-4 text-amber-500" />
                          First name
                        </span>
                        <input
                          type="text"
                          name="firstName"
                          value={registerData.firstName}
                          onChange={handleRegisterChange}
                          placeholder="Ada"
                          disabled={isSubmitting || loading}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <UserRound className="h-4 w-4 text-amber-500" />
                          Last name
                        </span>
                        <input
                          type="text"
                          name="lastName"
                          value={registerData.lastName}
                          onChange={handleRegisterChange}
                          placeholder="Miller"
                          disabled={isSubmitting || loading}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                        />
                      </label>
                    </div>

                    <label className="block space-y-2">
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <AtSign className="h-4 w-4 text-amber-500" />
                        Email address
                      </span>
                      <input
                        type="email"
                        name="email"
                        value={registerData.email}
                        onChange={handleRegisterChange}
                        placeholder="teacher@cmsgrammar.edu"
                        disabled={isSubmitting || loading}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Phone className="h-4 w-4 text-amber-500" />
                        Phone number
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        value={registerData.phone}
                        onChange={handleRegisterChange}
                        placeholder="08012345678"
                        disabled={isSubmitting || loading}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Lock className="h-4 w-4 text-amber-500" />
                        Password
                      </span>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={registerData.password}
                          onChange={handleRegisterChange}
                          placeholder="Create a strong password"
                          disabled={isSubmitting || loading}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-700"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </label>

                    <label className="block space-y-2">
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Lock className="h-4 w-4 text-amber-500" />
                        Confirm password
                      </span>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={registerData.confirmPassword}
                          onChange={handleRegisterChange}
                          placeholder="Re-enter your password"
                          disabled={isSubmitting || loading}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((value) => !value)
                          }
                          className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-700"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={isRegisterDisabled}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Creating account..." : "Create account"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                )}

                <p className="text-center text-sm text-slate-500">
                  By continuing, you agree to use secure school attendance
                  access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
