import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";
import { getBogotaNow, calculateAttendanceStatus } from "@/lib/attendance-time";
import { insertAttendanceRecord } from "@/lib/queries";
import { isUniqueViolation } from "@/lib/pg-errors";

/**
 * IMPORTANTE: este endpoint IGNORA por completo cualquier hora,
 * bloque o estado que pudiera venir en el cuerpo de la petición.
 * El único dato que se usa del cliente es la sesión (para saber
 * QUIÉN está registrando su llegada). La hora, el bloque y el color
 * siempre se calculan aquí, en el servidor, a partir de la hora
 * real del servidor.
 */
export async function POST() {
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

    if (calculation.type === "NO_SCHOOL_DAY") {
      return NextResponse.json(
        { error: "No hay registro de llegadas disponible hoy." },
        { status: 400 }
      );
    }

    if (calculation.type === "NO_ACTIVE_BLOCK") {
      return NextResponse.json(
        { error: "No existe una ventana de llegada activa en este momento." },
        { status: 400 }
      );
    }

    const record = await insertAttendanceRecord({
      studentId: session.studentId,
      attendanceDate: now.dateString,
      blockTime: calculation.blockTime,
      registeredAt: now.utcDate,
      status: calculation.status,
      minutesAfterStart: calculation.minutesAfterStart,
    });

    return NextResponse.json(
      {
        record: {
          id: record.id,
          attendanceDate: record.attendance_date,
          blockTime: record.block_time,
          registeredAt: record.registered_at,
          status: record.status,
          minutesAfterStart: record.minutes_after_start,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // La única restricción UNIQUE sobre esta tabla es
    // unique_student_block_per_day, así que basta con comprobar el
    // código 23505 sin depender del nombre exacto que el driver
    // exponga en `error.constraint`.
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "Ya registraste tu llegada para este bloque." },
        { status: 409 }
      );
    }

    console.error("Error al registrar llegada:", error);
    return NextResponse.json(
      { error: "No fue posible conectar con la base de datos." },
      { status: 500 }
    );
  }
}
