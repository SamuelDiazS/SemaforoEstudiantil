"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface NavbarProps {
  fullName: string;
  groupName: string;
}

export default function Navbar({ fullName, groupName }: NavbarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
      <div>
        <p className="text-sm text-slate-500">Hola, {fullName.split(" ")[0]}</p>
        <p className="text-xs font-medium text-slate-400">
          Grupo: {groupName}
        </p>
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
