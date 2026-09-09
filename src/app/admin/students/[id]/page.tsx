import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin-auth";
import {
  findStudentById,
  listAllAttendanceForStudent,
  listLateArrivalsForStudent,
} from "@/lib/queries";
import {
  ATTENDANCE_STATUS_SHORT_LABELS,
  formatBlockTime,
  formatBogotaDate,
  formatBogotaTime,
} from "@/lib/attendance-time";
import AdminNavbar from "@/components/AdminNavbar";

export default async function AdminStudentDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { filter?: string };
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const student = await findStudentById(params.id);
  if (!student) {
    notFound();
  }

  const showAll = searchParams.filter === "all";

  const records = showAll
    ? await listAllAttendanceForStudent(student.id)
    : await listLateArrivalsForStudent(student.id);

  const lateCount = showAll
    ? records.filter((r) => r.status === "RED").length
    : records.length;

  return (
    <div className="flex flex-1 flex-col">
      <AdminNavbar title={student.full_name} />

      <main className="flex flex-1 flex-col gap-4 px-5 py-6">
        <section className="card">
          <p className="text-sm text-slate-500">Usuario: @{student.username}</p>
          <p className="text-sm text-slate-500">Grupo: {student.group_name}</p>
          <p className="text-sm text-slate-500">
            Fecha de registro: {formatBogotaDate(new Date(student.created_at))}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            Total de llegadas tardías: {lateCount}
          </p>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">
              {showAll ? "Todos los registros" : "Llegadas tardías"}
            </h2>
            <div className="flex gap-2 text-xs font-semibold">
              <Link
                href={`/admin/students/${student.id}`}
                className={`rounded-full px-3 py-1.5 ${
                  !showAll
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                Solo tardanzas
              </Link>
              <Link
                href={`/admin/students/${student.id}?filter=all`}
                className={`rounded-full px-3 py-1.5 ${
                  showAll
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                Todos los registros
              </Link>
            </div>
          </div>

          {records.length === 0 && (
            <p className="text-center text-sm text-slate-400">
              No hay registros para mostrar.
            </p>
          )}

          <ul className="flex flex-col divide-y divide-slate-100">
            {records.map((record, index) => (
              <li
                key={`${record.attendance_date}-${record.block_time}-${index}`}
                className="card mb-2"
              >
                <p className="text-sm font-semibold text-slate-800">
                  {formatBogotaDate(new Date(record.registered_at))}
                </p>
                <p className="text-xs text-slate-500">
                  Hora del bloque: {formatBlockTime(record.block_time)}
                </p>
                <p className="text-xs text-slate-500">
                  Hora registrada: {formatBogotaTime(new Date(record.registered_at))}
                </p>
                {showAll && (
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Estado: {ATTENDANCE_STATUS_SHORT_LABELS[record.status]}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
