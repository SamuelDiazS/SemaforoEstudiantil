import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";
import { listRecentAttendanceForStudent } from "@/lib/queries";

export async function GET() {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json(
      { error: "No has iniciado sesión." },
      { status: 401 }
    );
  }

  try {
    const records = await listRecentAttendanceForStudent(session.studentId, 10);
    return NextResponse.json({
      records: records.map((r) => ({
        id: r.id,
        attendanceDate: r.attendance_date,
        blockTime: r.block_time,
        registeredAt: r.registered_at,
        status: r.status,
        minutesAfterStart: r.minutes_after_start,
      })),
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return NextResponse.json(
      { error: "No fue posible conectar con la base de datos." },
      { status: 500 }
    );
  }
}
