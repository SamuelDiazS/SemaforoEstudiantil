"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VALID_GROUPS } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (!groupName) {
      setError("Selecciona tu grupo.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          username,
          password,
          confirmPassword,
          groupName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No fue posible completar el registro.");
        setIsSubmitting(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("No fue posible conectar con el servidor.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-10">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Registrarse</h1>
        <p className="mt-1 text-sm text-slate-500">
          Crea tu cuenta de estudiante para registrar tus llegadas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="fullName" className="label">
            Nombre completo
          </label>
          <input
            id="fullName"
            type="text"
            required
            autoComplete="name"
            className="input-field"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="username" className="label">
            Usuario
          </label>
          <input
            id="username"
            type="text"
            required
            autoComplete="username"
            autoCapitalize="none"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="groupName" className="label">
            Grupo
          </label>
          <select
            id="groupName"
            required
            className="input-field"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="" disabled>
              Selecciona tu grupo
            </option>
            {VALID_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="password" className="label">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            className="input-field"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary mt-2" disabled={isSubmitting}>
          {isSubmitting ? "Registrando..." : "Registrarse"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-brand-600">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
