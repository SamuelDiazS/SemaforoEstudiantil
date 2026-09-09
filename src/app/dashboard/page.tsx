import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/auth";
import { listRecentAttendanceForStudent } from "@/lib/queries";
import Navbar from "@/components/Navbar";
import DashboardClient from "@/components/DashboardClient";
import type { PublicAttendanceRecord } from "@/types";

export default async function DashboardPage() {
  const session = await getStudentSession();
  if (!session) {
    redirect("/login");
  }

  let initialHistory: PublicAttendanceRecord[] = [];
  try {
    const records = await listRecentAttendanceForStudent(session.studentId, 10);
    initialHistory = records.map((r) => ({
      id: r.id,
      attendanceDate: r.attendance_date,
      blockTime: r.block_time,
      registeredAt: r.registered_at,
      status: r.status,
      minutesAfterStart: r.minutes_after_start,
    }));
  } catch (error) {
    console.error("Error al cargar historial inicial:", error);
  }

  return (
    <div className="flex flex-1 flex-col">
      <Navbar fullName={session.fullName} groupName={session.groupName} />
      <DashboardClient initialHistory={initialHistory} />
    </div>
  );
}
