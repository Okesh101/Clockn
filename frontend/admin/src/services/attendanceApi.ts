import api from "../utils/axiosConfig";
import type {
  AttendanceStats,
  AttendanceRange,
  TeacherAttendanceRow,
} from "../types/attendance";
import type { PaginationMeta } from "../types";

export async function fetchAttendanceStats(
  range: AttendanceRange,
  dates?: { start_date?: string; end_date?: string },
) {
  const { data } = await api.get<{
    data: AttendanceStats;
    meta?: { filtered_range?: { start: string; end: string } };
  }>("/attendance/stats", {
    params: { range_type: range, ...dates },
  });
  return data;
}

export async function fetchAttendanceLogs(
  page = 1,
  range: AttendanceRange = "today",
  dates?: { start_date?: string; end_date?: string },
) {
  const { data } = await api.get<{
    data: TeacherAttendanceRow[];
    meta?: PaginationMeta & { filtered_range?: { start: string; end: string } };
  }>("/attendance", {
    params: { page, range_type: range, ...dates },
  });
  return data;
}
