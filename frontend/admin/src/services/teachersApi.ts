// src/services/teachersApi.ts

import api from "../utils/axiosConfig";
import type { ApiResponse, PaginationMeta } from "../types";

export interface TeacherListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string | null;
  roles?: string[];
}

// Define the full response type with proper meta
export interface TeachersResponse {
  status: string;
  code: number;
  message: string;
  data: TeacherListItem[];
  meta: PaginationMeta;
}

export async function fetchTeachers(page: number): Promise<TeachersResponse> {
  const { data } = await api.get<TeachersResponse>("/teachers", {
    params: { page },
  });
  return data;
}

export async function fetchTeacherById(id: string): Promise<TeacherListItem> {
  const { data } = await api.get<ApiResponse<TeacherListItem>>(`/teachers/${id}`);
  return data.data as TeacherListItem;
}