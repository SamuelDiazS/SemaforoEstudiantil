import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { validateLoginInput } from "@/lib/validation";
import { findStudentByUsername } from "@/lib/queries";
import { createStudentSession } from "@/lib/auth";

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

  const result = validateLoginInput(body);
  if (!result.valid || !result.data) {
    return NextResponse.json(
      { error: result.errors[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const { username, password } = result.data;

  try {
    const student = await findStudentByUsername(username);
    if (!student) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos." },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      student.password_hash
    );
    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos." },
        { status: 401 }
      );
    }

    await createStudentSession({
      studentId: student.id,
      username: student.username,
      fullName: student.full_name,
      groupName: student.group_name,
    });

    return NextResponse.json(
      {
        student: {
          id: student.id,
          fullName: student.full_name,
          username: student.username,
          groupName: student.group_name,
          createdAt: student.created_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return NextResponse.json(
      { error: "No fue posible conectar con la base de datos." },
      { status: 500 }
    );
  }
}
