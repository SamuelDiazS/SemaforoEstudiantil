import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { GroupName } from "@/types";

// ============================================================
// Sesión de ESTUDIANTES.
//
// Usa un JWT firmado (HS256) guardado en una cookie HTTP-only,
// secure (en producción) y SameSite=Lax. Nunca se guarda en
// localStorage/sessionStorage ni en una cookie legible por JS.
//
// La sesión de administrador vive en un archivo separado
// (admin-auth.ts) con su propio nombre de cookie, para que un
// estudiante nunca pueda "convertirse" en admin modificando una
// cookie.
// ============================================================

const STUDENT_COOKIE_NAME = "session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 días

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

export interface StudentSessionPayload {
  studentId: string;
  username: string;
  fullName: string;
  groupName: GroupName;
}

export async function createStudentSession(
  payload: StudentSessionPayload
): Promise<void> {
  const token = await new SignJWT({ ...payload, role: "student" as const })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(STUDENT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getStudentSession(): Promise<StudentSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== "student") return null;
    if (
      typeof payload.studentId !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.fullName !== "string" ||
      typeof payload.groupName !== "string"
    ) {
      return null;
    }
    return {
      studentId: payload.studentId,
      username: payload.username,
      fullName: payload.fullName,
      groupName: payload.groupName as GroupName,
    };
  } catch {
    return null;
  }
}

export async function destroyStudentSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(STUDENT_COOKIE_NAME);
}
