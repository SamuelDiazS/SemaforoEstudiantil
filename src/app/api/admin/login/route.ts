import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials, createAdminSession } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida." },
      { status: 400 }
    );
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const username = typeof b.username === "string" ? b.username.trim() : "";
  const password = typeof b.password === "string" ? b.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Usuario y contraseña son obligatorios." },
      { status: 400 }
    );
  }

  try {
    const isValid = verifyAdminCredentials(username, password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos." },
        { status: 401 }
      );
    }

    await createAdminSession(username);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Error al iniciar sesión de administrador:", error);
    return NextResponse.json(
      { error: "No fue posible iniciar sesión en este momento." },
      { status: 500 }
    );
  }
}
