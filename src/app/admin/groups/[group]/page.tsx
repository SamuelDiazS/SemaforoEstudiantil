import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin-auth";
import { isValidGroup } from "@/types";
import { listStudentsByGroup } from "@/lib/queries";
import AdminNavbar from "@/components/AdminNavbar";

export default async function AdminGroupPage({
  params,
}: {
  params: { group: string };
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const groupName = decodeURIComponent(params.group);
  if (!isValidGroup(groupName)) {
    notFound();
  }

  let students: Awaited<ReturnType<typeof listStudentsByGroup>> = [];
  let loadError: string | null = null;

  try {
    students = await listStudentsByGroup(groupName);
  } catch (error) {
    console.error("Error al cargar estudiantes del grupo:", error);
    loadError = "No fue posible conectar con la base de datos.";
  }

  return (
    <div className="flex flex-1 flex-col">
      <AdminNavbar title={`Grupo ${groupName}`} />

      <main className="flex flex-1 flex-col gap-4 px-5 py-6">
        {loadError && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {!loadError && students.length === 0 && (
          <p className="text-center text-sm text-slate-400">
            Este grupo todavía no tiene estudiantes registrados.
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {students.map((student) => (
            <li key={student.id}>
              <Link
                href={`/admin/students/${student.id}`}
                className="card flex items-center justify-between hover:bg-slate-50"
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    {student.fullName}
                  </p>
                  <p className="text-xs text-slate-400">
                    @{student.username}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    student.lateCount > 0
                      ? "bg-red-50 text-red-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {student.lateCount}{" "}
                  {student.lateCount === 1 ? "llegada tarde" : "llegadas tarde"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
