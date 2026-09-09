import { redirect } from "next/navigation";
import Link from "next/link";
import { getStudentSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getStudentSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <div className="space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
          RL
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Registro de Llegadas
        </h1>
        <p className="text-slate-500">
          Consulta el semáforo de llegada y registra tu asistencia.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link href="/login" className="btn-primary">
          Iniciar sesión
        </Link>
        <Link href="/register" className="btn-secondary">
          Registrarse
        </Link>
      </div>
    </main>
  );
}
