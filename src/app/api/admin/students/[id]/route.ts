import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { findStudentById, listLateArrivalsForStudent } from "@/lib/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: "No has iniciado sesión como administrador." },
      { status: 401 }
    );
  }

  try {
    const student = await findStudentById(params.id);
    if (!student) {
      return NextResponse.json(
        { error: "Estudiante no encontrado." },
        { status: 404 }
      );
    }

    const lateArrivals = await listLateArrivalsForStudent(student.id);

    return NextResponse.json({
      student: {
        id: student.id,
        fullName: student.full_name,
        username: student.username,
        groupName: student.group_name,
        createdAt: student.created_at,
      },
      lateArrivals: lateArrivals.map((r) => ({
        attendanceDate: r.attendance_date,
        blockTime: r.block_time,
        registeredAt: r.registered_at,
        minutesAfterStart: r.minutes_after_start,
      })),
      totalLate: lateArrivals.length,
    });
  } catch (error) {
    console.error("Error al obtener detalle del estudiante:", error);
    return NextResponse.json(
      { error: "No fue posible conectar con la base de datos." },
      { status: 500 }
    );
  }
}
