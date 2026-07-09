// src/types/index.ts
export interface Teacher {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  created_at?: string;
}

export interface AuthResponse {
  status: string;
  access_token: string;
  refresh_token: string;
  teacher: Teacher;
  message?: string;
  code: number;
}

export interface ApiError {
  status: string;
  message: string;
  code: number;
}