import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getBogotaNow } from "@/lib/attendance-time";
import {
  countLateBetweenDates,
  countLateOnDate,
  countTotalLate,
  countTotalStudents,
} from "@/lib/queries";

function getStartOfWeekDateString(now: ReturnType<typeof getBogotaNow>): string {
  // ISO: lunes = inicio de semana. dayOfWeek: 0=domingo..6=sábado.
  const daysSinceMonday = (now.dayOfWeek + 6) % 7;
  const startOfWeek = new Date(
    Date.UTC(now.year, now.month - 1, now.day - daysSinceMonday)
  );
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${startOfWeek.getUTCFullYear()}-${pad(
    startOfWeek.getUTCMonth() + 1
  )}-${pad(startOfWeek.getUTCDate())}`;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: "No has iniciado sesión como administrador." },
      { status: 401 }
    );
  }

  try {
    const now = getBogotaNow();
    const startOfWeek = getStartOfWeekDateString(now);

    const [totalStudents, lateToday, lateThisWeek, lateTotal] =
      await Promise.all([
        countTotalStudents(),
        countLateOnDate(now.dateString),
        countLateBetweenDates(startOfWeek, now.dateString),
        countTotalLate(),
      ]);

    return NextResponse.json({
      totalStudents,
      lateToday,
      lateThisWeek,
      lateTotal,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return NextResponse.json(
      { error: "No fue posible conectar con la base de datos." },
      { status: 500 }
    );
  }
}
