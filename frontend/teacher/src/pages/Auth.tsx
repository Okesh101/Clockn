import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

import {
  AuthCard,
  AuthContainer,
  AuthHeader,
  AuthSwitcher,
  LoginForm,
  RegisterForm,
} from "../components/auth";
import { useAuth } from "../contexts/AuthContext";
import { useAuthForm } from "../hooks/useAuthForm";

type AuthMode = "login" | "register";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null) {
    const maybeAxios = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return maybeAxios.response?.data?.message || maybeAxios.message || fallback;
  }
  return fallback;
};

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");

  const {
    form,
    loading,
    setLoading,
    error,
    setError,
    clearError,
    updateField,
    reset,
    validateLogin,
    validateRegister,
    getLoginPayload,
    getRegisterPayload,
  } = useAuthForm();

  const fromPath =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || "/";

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(fromPath, { replace: true });
    }
  }, [authLoading, fromPath, isAuthenticated, navigate]);

  const toggleMode = () => {
    setMode((current) => (current === "login" ? "register" : "login"));
    clearError();
    reset();
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
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

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();

    const validation = validateRegister();
    if (!validation.valid) {
      setError(validation.message ?? "Please check your details.");
      return;
    }

    setLoading(true);
    try {
      await register(getRegisterPayload());
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";
  const isSubmitting = loading || authLoading;

  return (
    <AuthContainer>
      <AuthCard>
        <AuthHeader
          title={isLogin ? "Welcome back" : "Create your account"}
          subtitle={
            isLogin
              ? "Sign in to clock in, manage attendance, and stay on schedule."
              : "Register to join your school's teacher attendance portal."
          }
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {isLogin ? (
              <LoginForm
                form={form}
                loading={isSubmitting}
                error={error}
                updateField={updateField}
                onSubmit={handleLoginSubmit}
              />
            ) : (
              <RegisterForm
                form={form}
                loading={isSubmitting}
                error={error}
                updateField={updateField}
                onSubmit={handleRegisterSubmit}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <AuthSwitcher login={isLogin} onToggle={toggleMode} />
      </AuthCard>
    </AuthContainer>
  );
}
