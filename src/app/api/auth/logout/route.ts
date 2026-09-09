import { NextResponse } from "next/server";
import { destroyStudentSession } from "@/lib/auth";

export async function POST() {
  await destroyStudentSession();
  return NextResponse.json({ ok: true }, { status: 200 });
}
