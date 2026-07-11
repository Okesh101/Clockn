import api from "../utils/axiosConfig";
import type { AdminUser, PaginationMeta } from "../types";

export interface TeacherListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string | null;
}

export async function fetchTeachers(page = 1) {
  const { data } = await api.get<{
    data: TeacherListItem[];
    meta?: PaginationMeta;
  }>("/teachers", {
    params: { page },
  });
  return data;
}

export async function fetchTeacherById(id: string) {
  const { data } = await api.get<{ data: AdminUser }>(`/teachers/${id}`);
  return data.data;
}
