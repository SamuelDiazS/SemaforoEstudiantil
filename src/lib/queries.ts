import { sql } from "@/lib/db";
import type {
  AttendanceRecordRow,
  AttendanceStatus,
  GroupName,
  StudentRecord,
  StudentWithLateCount,
} from "@/types";

// ============================================================
// Todas las consultas SQL de la aplicación viven aquí.
//
// Las tablas oficiales son exactamente:
//   - students
//   - attendance_records
//
// No se usan en ningún otro nombre (users, student, attendance,
// arrivals, late_records, etc.). Todas las consultas son
// parametrizadas ($1, $2, ...) mediante el tagged template `sql`
// de @neondatabase/serverless, que ya se encarga de escapar los
// valores y prevenir inyección SQL.
// ============================================================

// ---------- Estudiantes ----------

export async function insertStudent(params: {
  fullName: string;
  username: string;
  passwordHash: string;
  groupName: GroupName;
}): Promise<StudentRecord> {
  const rows = await sql`
    INSERT INTO students (
        full_name,
        username,
        password_hash,
        group_name
    )
    VALUES (
        ${params.fullName},
        ${params.username},
        ${params.passwordHash},
        ${params.groupName}
    )
    RETURNING
        id,
        full_name,
        username,
        password_hash,
        group_name,
        created_at,
        updated_at;
  `;
  return rows[0] as StudentRecord;
}

export async function findStudentByUsername(
  username: string
): Promise<(StudentRecord & { password_hash: string }) | null> {
  const rows = await sql`
    SELECT
        id,
        full_name,
        username,
        password_hash,
        group_name,
        created_at,
        updated_at
    FROM students
    WHERE username = ${username}
    LIMIT 1;
  `;
  return (rows[0] as (StudentRecord & { password_hash: string })) ?? null;
}

export async function findStudentById(
  studentId: string
): Promise<StudentRecord | null> {
  const rows = await sql`
    SELECT
        id,
        full_name,
        username,
        group_name,
        created_at,
        updated_at
    FROM students
    WHERE id = ${studentId}
    LIMIT 1;
  `;
  return (rows[0] as StudentRecord) ?? null;
}

export async function listStudentsByGroup(
  groupName: GroupName
): Promise<StudentWithLateCount[]> {
  const rows = await sql`
    SELECT
        s.id,
        s.full_name,
        s.username,
        s.group_name,
        s.created_at,
        COUNT(ar.id) FILTER (
            WHERE ar.status = 'RED'
        ) AS late_count
    FROM students s
    LEFT JOIN attendance_records ar
        ON ar.student_id = s.id
    WHERE s.group_name = ${groupName}
    GROUP BY
        s.id,
        s.full_name,
        s.username,
        s.group_name,
        s.created_at
    ORDER BY s.full_name ASC;
  `;

  return rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    username: row.username,
    groupName: row.group_name,
    createdAt: row.created_at,
    lateCount: Number(row.late_count),
  }));
}

// ---------- Registros de llegada ----------

export async function insertAttendanceRecord(params: {
  studentId: string;
  attendanceDate: string; // YYYY-MM-DD
  blockTime: string; // HH:MM
  registeredAt: Date;
  status: AttendanceStatus;
  minutesAfterStart: number;
}): Promise<AttendanceRecordRow> {
  const rows = await sql`
    INSERT INTO attendance_records (
        student_id,
        attendance_date,
        block_time,
        registered_at,
        status,
        minutes_after_start
    )
    VALUES (
        ${params.studentId},
        ${params.attendanceDate},
        ${params.blockTime},
        ${params.registeredAt.toISOString()},
        ${params.status},
        ${params.minutesAfterStart}
    )
    RETURNING *;
  `;
  return rows[0] as AttendanceRecordRow;
}

export async function findAttendanceRecordForBlock(params: {
  studentId: string;
  attendanceDate: string;
  blockTime: string;
}): Promise<AttendanceRecordRow | null> {
  const rows = await sql`
    SELECT *
    FROM attendance_records
    WHERE student_id = ${params.studentId}
      AND attendance_date = ${params.attendanceDate}
      AND block_time = ${params.blockTime}
    LIMIT 1;
  `;
  return (rows[0] as AttendanceRecordRow) ?? null;
}

export async function listRecentAttendanceForStudent(
  studentId: string,
  limit = 10
): Promise<AttendanceRecordRow[]> {
  const rows = await sql`
    SELECT *
    FROM attendance_records
    WHERE student_id = ${studentId}
    ORDER BY registered_at DESC
    LIMIT ${limit};
  `;
  return rows as AttendanceRecordRow[];
}

export async function listAllAttendanceForStudent(
  studentId: string
): Promise<AttendanceRecordRow[]> {
  const rows = await sql`
    SELECT *
    FROM attendance_records
    WHERE student_id = ${studentId}
    ORDER BY registered_at DESC;
  `;
  return rows as AttendanceRecordRow[];
}

export async function listLateArrivalsForStudent(
  studentId: string
): Promise<AttendanceRecordRow[]> {
  const rows = await sql`
    SELECT
        attendance_date,
        block_time,
        registered_at,
        minutes_after_start
    FROM attendance_records
    WHERE student_id = ${studentId}
      AND status = 'RED'
    ORDER BY registered_at DESC;
  `;
  return rows as AttendanceRecordRow[];
}

export interface LateArrivalWithStudent {
  id: string;
  attendance_date: string;
  block_time: string;
  registered_at: string;
  status: AttendanceStatus;
  minutes_after_start: number;
  student_id: string;
  full_name: string;
  username: string;
  group_name: GroupName;
}

export async function listAllLateArrivals(): Promise<LateArrivalWithStudent[]> {
  const rows = await sql`
    SELECT
        ar.id,
        ar.attendance_date,
        ar.block_time,
        ar.registered_at,
        ar.status,
        ar.minutes_after_start,
        s.id AS student_id,
        s.full_name,
        s.username,
        s.group_name
    FROM attendance_records ar
    INNER JOIN students s
        ON s.id = ar.student_id
    WHERE ar.status = 'RED'
    ORDER BY ar.registered_at DESC;
  `;
  return rows as LateArrivalWithStudent[];
}

export async function listAttendanceByGroup(params: {
  groupName: GroupName;
  onlyLate: boolean;
  date?: string;
}): Promise<LateArrivalWithStudent[]> {
  const rows = params.date
    ? params.onlyLate
      ? await sql`
          SELECT
              ar.id, ar.attendance_date, ar.block_time, ar.registered_at,
              ar.status, ar.minutes_after_start,
              s.id AS student_id, s.full_name, s.username, s.group_name
          FROM attendance_records ar
          INNER JOIN students s ON s.id = ar.student_id
          WHERE s.group_name = ${params.groupName}
            AND ar.status = 'RED'
            AND ar.attendance_date = ${params.date}
          ORDER BY ar.registered_at DESC;
        `
      : await sql`
          SELECT
              ar.id, ar.attendance_date, ar.block_time, ar.registered_at,
              ar.status, ar.minutes_after_start,
              s.id AS student_id, s.full_name, s.username, s.group_name
          FROM attendance_records ar
          INNER JOIN students s ON s.id = ar.student_id
          WHERE s.group_name = ${params.groupName}
            AND ar.attendance_date = ${params.date}
          ORDER BY ar.registered_at DESC;
        `
    : params.onlyLate
      ? await sql`
          SELECT
              ar.id, ar.attendance_date, ar.block_time, ar.registered_at,
              ar.status, ar.minutes_after_start,
              s.id AS student_id, s.full_name, s.username, s.group_name
          FROM attendance_records ar
          INNER JOIN students s ON s.id = ar.student_id
          WHERE s.group_name = ${params.groupName}
            AND ar.status = 'RED'
          ORDER BY ar.registered_at DESC;
        `
      : await sql`
          SELECT
              ar.id, ar.attendance_date, ar.block_time, ar.registered_at,
              ar.status, ar.minutes_after_start,
              s.id AS student_id, s.full_name, s.username, s.group_name
          FROM attendance_records ar
          INNER JOIN students s ON s.id = ar.student_id
          WHERE s.group_name = ${params.groupName}
          ORDER BY ar.registered_at DESC;
        `;

  return rows as LateArrivalWithStudent[];
}

// ---------- Estadísticas del admin ----------

export async function countTotalStudents(): Promise<number> {
  const rows = await sql`SELECT COUNT(*) AS total FROM students;`;
  return Number(rows[0].total);
}

export async function countLateOnDate(dateString: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*) AS total
    FROM attendance_records
    WHERE status = 'RED'
      AND attendance_date = ${dateString};
  `;
  return Number(rows[0].total);
}

export async function countLateBetweenDates(
  startDate: string,
  endDate: string
): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*) AS total
    FROM attendance_records
    WHERE status = 'RED'
      AND attendance_date BETWEEN ${startDate} AND ${endDate};
  `;
  return Number(rows[0].total);
}

export async function countTotalLate(): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*) AS total
    FROM attendance_records
    WHERE status = 'RED';
  `;
  return Number(rows[0].total);
}
