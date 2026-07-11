export interface AdminUser {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  phone?: string;
  roles?: string[];
  created_at?: string;
}

export interface AuthResponse {
  status: string;
  access_token: string;
  refresh_token: string;
  teacher: AdminUser;
  message?: string;
  code: number;
}

export interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  code: number;
  data?: T;
  meta?: Record<string, unknown>;
}

export interface PaginationMeta {
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}
