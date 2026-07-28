// src/services/requestsApi.ts
import api from "../utils/axiosConfig";

export interface AttendanceRequest {
  id: string;
  teacher_id: string;
  attendance_id: string;
  teacher_note: string | null;
  admin_note: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  resolved_by: string | null;
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface RequestsResponse {
  status: string;
  code: number;
  message: string;
  meta: {
    total_items: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
  data: AttendanceRequest[];
}

// Admin endpoints
export async function fetchAllRequests(
  page: number = 1,
  perPage: number = 10,
  status?: string
): Promise<RequestsResponse> {
  const { data } = await api.get<RequestsResponse>("/requests", {
    params: {
      page,
      per_page: perPage,
      status,
    },
  });
  return data;
}

export async function reviewRequest(
  requestId: string,
  action: "approve" | "reject",
  note?: string
): Promise<void> {
  const { data } = await api.patch(`/requests/${requestId}/review`, {
    action,
    note,
  });
  return data;
}