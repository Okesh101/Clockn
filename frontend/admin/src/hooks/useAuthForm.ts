import { useState } from "react";

export interface LoginFormData {
  email: string;
  password: string;
}

const initialState: LoginFormData = {
  email: "",
  password: "",
};

export function useAuthForm() {
  const [form, setForm] = useState<LoginFormData>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clearError = () => setError("");
  const reset = () => {
    setForm(initialState);
    setError("");
  };

  const updateField = (field: keyof LoginFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateLogin = () => {
    if (!form.email.trim() || !form.password.trim()) {
      return { valid: false as const, message: "Please fill in all fields." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return {
        valid: false as const,
        message: "Please enter a valid email address.",
      };
    }
    return { valid: true as const };
  };

  return {
    form,
    loading,
    setLoading,
    error,
    setError,
    clearError,
    updateField,
    reset,
    validateLogin,
    getLoginPayload: () => ({
      email: form.email.trim(),
      password: form.password,
    }),
  };
}
