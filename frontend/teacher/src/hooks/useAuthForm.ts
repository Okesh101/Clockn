// src/hooks/useAuthForm.ts

import { useState } from "react";

import type {
  AuthFormData,
  LoginPayload,
  RegisterPayload,
  AuthValidationResult,
} from "../types/auth";

const initialState: AuthFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export function useAuthForm() {
  const [form, setForm] = useState<AuthFormData>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const reset = () => {
    setForm(initialState);
    setError("");
  };
  const clearError = () => setError("");
  const updateField = (
    field: keyof AuthFormData,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 11;
  };

  const validateLogin =
    (): AuthValidationResult => {
      if (!form.email.trim() || !form.password.trim()) {
        return {
          valid: false,
          message: "Please fill in all required fields.",
        };
      }

      if (!validateEmail(form.email)) {
        return {
          valid: false,
          message: "Please enter a valid email address.",
        };
      }

      return {
        valid: true,
      };
    };

  const validateRegister =
    (): AuthValidationResult => {
      if (
        !form.firstName.trim() ||
        !form.lastName.trim() ||
        !form.email.trim() ||
        !form.phone.trim() ||
        !form.password.trim() ||
        !form.confirmPassword.trim()
      ) {
        return {
          valid: false,
          message: "Please complete all required fields.",
        };
      }

      if (!validateEmail(form.email)) {
        return {
          valid: false,
          message: "Please enter a valid email address.",
        };
      }

      if (!validatePhone(form.phone)) {
        return {
          valid: false,
          message: "Please enter a valid phone number.",
        };
      }

      if (form.password.length < 8) {
        return {
          valid: false,
          message:
            "Password must be at least 8 characters long.",
        };
      }

      // ⭐ Frontend-only validation
      if (
        form.password !== form.confirmPassword
      ) {
        return {
          valid: false,
          message:
            "Passwords do not match. Please confirm your password.",
        };
      }

      return {
        valid: true,
      };
    };

  const getLoginPayload =
    (): LoginPayload => ({
      email: form.email.trim(),
      password: form.password,
    });

  const getRegisterPayload =
    (): RegisterPayload => ({
      firstname: form.firstName.trim(),
      lastname: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.replace(/\D/g, ""),
      password: form.password,
    });

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
    validateRegister,
    getLoginPayload,
    getRegisterPayload,
  };
}