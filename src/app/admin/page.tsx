import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin-auth";
import { getBogotaNow } from "@/lib/attendance-time";
import {
  countLateBetweenDates,
  countLateOnDate,
  countTotalLate,
  countTotalStudents,
} from "@/lib/queries";
import { VALID_GROUPS } from "@/types";
import AdminNavbar from "@/components/AdminNavbar";

function getStartOfWeekDateString(now: ReturnType<typeof getBogotaNow>): string {
  const daysSinceMonday = (now.dayOfWeek + 6) % 7;
  const startOfWeek = new Date(
    Date.UTC(now.year, now.month - 1, now.day - daysSinceMonday)
  );
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${startOfWeek.getUTCFullYear()}-${pad(
    startOfWeek.getUTCMonth() + 1
  )}-${pad(startOfWeek.getUTCDate())}`;
}

export default async function AdminHomePage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const now = getBogotaNow();
  const startOfWeek = getStartOfWeekDateString(now);

  let stats = { totalStudents: 0, lateToday: 0, lateThisWeek: 0, lateTotal: 0 };
  let loadError: string | null = null;

  try {
    const [totalStudents, lateToday, lateThisWeek, lateTotal] =
      await Promise.all([
        countTotalStudents(),
        countLateOnDate(now.dateString),
        countLateBetweenDates(startOfWeek, now.dateString),
        countTotalLate(),
      ]);
    stats = { totalStudents, lateToday, lateThisWeek, lateTotal };
  } catch (error) {
    console.error("Error al cargar estadísticas del admin:", error);
    loadError = "No fue posible conectar con la base de datos.";
  }

  const statCards = [
    { label: "Total estudiantes", value: stats.totalStudents },
    { label: "Llegadas tardías hoy", value: stats.lateToday },
    { label: "Llegadas tardías esta semana", value: stats.lateThisWeek },
    { label: "Llegadas tardías totales", value: stats.lateTotal },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <AdminNavbar title="Resumen general" />

      <main className="flex flex-1 flex-col gap-6 px-5 py-6">
        {loadError && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3">
          {statCards.map((stat) => (
            <div key={stat.label} className="card text-center">
              <p className="text-2xl font-bold text-slate-800">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-800">
            Grupos
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {VALID_GROUPS.map((group) => (
              <Link
                key={group}
                href={`/admin/groups/${group}`}
                className="card flex items-center justify-center py-4 text-center font-semibold text-brand-700 hover:bg-brand-50"
              >
                {group}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
