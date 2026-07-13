export type AttendanceRange = "today" | "yesterday" | "week" | "month" | "custom";

export interface AttendanceStats {
  total_teachers: number;
  total_present: number;
  total_on_time: number;
  total_late: number;
  total_absent: number;
}

export interface AttendanceRecord {
  log_id: string | null;
  presence_status: string;
  punctuality_status: string | null;
  time_in: string | null;
  time_out: string | null;
  time_in_method: string | null;
  time_out_method: string | null;
  clock_in_location: string | null;
  clock_out_location: string | null;
  duration_spent: string | null;
}

export interface TeacherAttendanceRow {
  teacher_id: string;
  teacher_name: string;
  email: string;
  phone: string;
  attendance_record: AttendanceRecord;
}
