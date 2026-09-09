import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// ============================================================
// Sesión de ADMINISTRADOR.
//
// Completamente separada de la sesión de estudiantes: cookie
// distinta ("admin_session") y "role" distinto dentro del JWT.
// Esto impide que un estudiante pueda acceder a /admin
// modificando manualmente su cookie de sesión.
//
// Las credenciales de administrador NO viven en la tabla
// `students`; se comparan directamente contra las variables de
// entorno ADMIN_USERNAME / ADMIN_PASSWORD. No existe registro de
// administradores.
// ============================================================

const ADMIN_COOKIE_NAME = "admin_session";
const ADMIN_SESSION_DURATION_SECONDS = 60 * 60 * 12; // 12 horas

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET no está definida o es demasiado corta. Configúrala en tu .env " +
        "(ver .env.example) con un valor largo y aleatorio."
    );
  }
  return new TextEncoder().encode(secret);
}

export interface AdminSessionPayload {
  username: string;
}

export function verifyAdminCredentials(
  username: string,
  password: string
): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    throw new Error(
      "ADMIN_USERNAME o ADMIN_PASSWORD no están configuradas en las variables de entorno."
    );
  }

  return username === expectedUsername && password === expectedPassword;
}

export async function createAdminSession(username: string): Promise<void> {
  const token = await new SignJWT({ username, role: "admin" as const })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_DURATION_SECONDS,
  });
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== "admin" || typeof payload.username !== "string") {
      return null;
    }
    return { username: payload.username };
  } catch {
    return null;
  }
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
