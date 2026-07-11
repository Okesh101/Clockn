export interface AttendanceRecord {
  log_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: "present" | "absent" | string;
  punctuality: "on_time" | "late" | null;
  time_in_method: "button" | "qr" | null;
  time_out_method: "button" | "qr" | null;
  clock_in_location: string | null;
  clock_out_location: string | null;
  duration_minutes: number | null;
}

export interface AttendanceHistoryMeta {
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface AttendanceHistoryResponse {
  status: string;
  code: number;
  message?: string;
  data: AttendanceRecord[];
  meta?: AttendanceHistoryMeta;
}
