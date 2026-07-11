import api from "../utils/axiosConfig";
import type { AttendanceHistoryResponse } from "../types/attendance";

export type HistoryRange = "week" | "month" | "all";

export async function fetchMyAttendanceHistory(
  page = 1,
  range: HistoryRange = "month",
): Promise<AttendanceHistoryResponse> {
  const { data } = await api.get<AttendanceHistoryResponse>(
    "/attendance/me",
    {
      params: { page, range_type: range },
    },
  );
  return data;
}
