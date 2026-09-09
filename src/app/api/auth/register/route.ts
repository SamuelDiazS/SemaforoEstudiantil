import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { validateRegisterInput } from "@/lib/validation";
import { insertStudent } from "@/lib/queries";
import { createStudentSession } from "@/lib/auth";
import { isUniqueViolation } from "@/lib/pg-errors";

const BCRYPT_SALT_ROUNDS = 10;

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

  const result = validateRegisterInput(body);
  if (!result.valid || !result.data) {
    return NextResponse.json(
      {
        error: result.errors[0]?.message ?? "Datos inválidos.",
        fieldErrors: result.errors,
      },
      { status: 400 }
    );
  }

  const { fullName, username, password, groupName } = result.data;

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const student = await insertStudent({
      fullName,
      username,
      passwordHash,
      groupName,
    });

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
      { status: 201 }
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "Ese nombre de usuario ya está registrado." },
        { status: 409 }
      );
    }

    console.error("Error al registrar estudiante:", error);
    return NextResponse.json(
      { error: "No fue posible conectar con la base de datos." },
      { status: 500 }
    );
  }
}
