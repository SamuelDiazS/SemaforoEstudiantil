"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function AdminNavbar({ title }: { title: string }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
      <div>
        <Link href="/admin" className="text-xs font-semibold text-brand-600">
          ← Panel administrativo
        </Link>
        <p className="text-base font-bold text-slate-800">{title}</p>
      </div>
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-60"
      >
        {isLoggingOut ? "Saliendo..." : "Cerrar sesión"}
      </button>
    </header>
  );
}
