// src/types/auth.ts

export interface AuthFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthValidationResult {
  valid: boolean;
  message?: string;
}