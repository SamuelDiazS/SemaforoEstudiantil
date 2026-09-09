// ============================================================
// Tipos compartidos de la aplicación
// ============================================================

export const VALID_GROUPS = [
  "11-1",
  "11-2",
  "11-3",
  "11-4",
  "11-5",
  "11-6",
] as const;

export type GroupName = (typeof VALID_GROUPS)[number];

export function isValidGroup(value: unknown): value is GroupName {
  return (
    typeof value === "string" &&
    (VALID_GROUPS as readonly string[]).includes(value)
  );
}

export type AttendanceStatus = "GREEN" | "YELLOW" | "RED";

export interface StudentRecord {
  id: string;
  full_name: string;
  username: string;
  group_name: GroupName;
  created_at: string;
  updated_at: string;
}

export interface PublicStudent {
  id: string;
  fullName: string;
  username: string;
  groupName: GroupName;
  createdAt: string;
}

export interface AttendanceRecordRow {
  id: string;
  student_id: string;
  attendance_date: string;
  block_time: string;
  registered_at: string;
  status: AttendanceStatus;
  minutes_after_start: number;
  created_at: string;
}

export interface PublicAttendanceRecord {
  id: string;
  attendanceDate: string;
  blockTime: string;
  registeredAt: string;
  status: AttendanceStatus;
  minutesAfterStart: number;
}

export interface StudentWithLateCount {
  id: string;
  fullName: string;
  username: string;
  groupName: GroupName;
  createdAt: string;
  lateCount: number;
}

export interface AdminStats {
  totalStudents: number;
  lateToday: number;
  lateThisWeek: number;
  lateTotal: number;
}
