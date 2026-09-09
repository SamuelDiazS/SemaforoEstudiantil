import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { isValidGroup } from "@/types";
import { listStudentsByGroup } from "@/lib/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: { group: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: "No has iniciado sesión como administrador." },
      { status: 401 }
    );
  }

  const groupName = decodeURIComponent(params.group);
  if (!isValidGroup(groupName)) {
    return NextResponse.json(
      { error: "El grupo indicado no es válido." },
      { status: 400 }
    );
  }

  try {
    const students = await listStudentsByGroup(groupName);
    return NextResponse.json({ groupName, students });
  } catch (error) {
    console.error("Error al obtener estudiantes por grupo:", error);
    return NextResponse.json(
      { error: "No fue posible conectar con la base de datos." },
      { status: 500 }
    );
  }
}
