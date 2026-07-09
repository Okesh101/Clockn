// src/types/index.ts
export interface Teacher {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  phone?: string;
  roles?: string[];
  created_at?: string;
}

export interface RegisterPayload {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  status: string;
  access_token: string;
  refresh_token: string;
  teacher: Teacher;
  message?: string;
  code: number;
}

export interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  code: number;
  data?: T;
}

export interface ApiError {
  status: string;
  message: string;
  code: number;
}
