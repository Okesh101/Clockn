// src/services/attendanceApi.ts
import api from "../utils/axiosConfig";
import type { AttendanceRecord } from "../types/attendance";

export type HistoryRange = "all" | "week" | "month";

export interface HistoryMeta {
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
  filtered_range: {
    start: string;
    end: string;
  };
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    onTime: number;
  };
}

export interface HistoryResponse {
  status: string;
  code: number;
  message: string;
  meta: HistoryMeta;
  data: AttendanceRecord[];
}

export async function fetchMyAttendanceHistory(
  page: number = 1,
  rangeType: HistoryRange = "all"
): Promise<HistoryResponse> {
  const { data } = await api.get<HistoryResponse>("/attendance/me", {
    params: {
      page,
      range_type: rangeType,
    },
  });
  return data;
}