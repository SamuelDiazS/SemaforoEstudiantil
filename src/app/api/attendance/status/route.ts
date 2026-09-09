import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";
import { getBogotaNow, calculateAttendanceStatus } from "@/lib/attendance-time";
import { findAttendanceRecordForBlock } from "@/lib/queries";

export async function GET() {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json(
      { error: "No has iniciado sesión." },
      { status: 401 }
    );
  }

  try {
    const now = getBogotaNow();
    const calculation = calculateAttendanceStatus(now);

    if (calculation.type !== "ACTIVE") {
      return NextResponse.json({
        type: calculation.type,
        serverTime: now.utcDate.toISOString(),
      });
    }

    const existingRecord = await findAttendanceRecordForBlock({
      studentId: session.studentId,
      attendanceDate: now.dateString,
      blockTime: calculation.blockTime,
    });

    return NextResponse.json({
      type: "ACTIVE",
      blockTime: calculation.blockTime,
      status: calculation.status,
      minutesAfterStart: calculation.minutesAfterStart,
      secondsAfterStart: calculation.secondsAfterStart,
      secondsUntilNextChange: calculation.secondsUntilNextChange,
      serverTime: now.utcDate.toISOString(),
      alreadyRegistered: Boolean(existingRecord),
      registeredRecord: existingRecord
        ? {
            registeredAt: existingRecord.registered_at,
            status: existingRecord.status,
            blockTime: existingRecord.block_time,
          }
        : null,
    });
  } catch (error) {
    console.error("Error al calcular el estado de asistencia:", error);
    return NextResponse.json(
      { error: "No fue posible conectar con la base de datos." },
      { status: 500 }
    );
  }
}
