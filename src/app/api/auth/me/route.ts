import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";

export async function GET() {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json(
      { error: "No has iniciado sesión." },
      { status: 401 }
    );
  }
  return NextResponse.json({ student: session }, { status: 200 });
}
