import {
  ATTENDANCE_STATUS_SHORT_LABELS,
  formatBogotaDate,
  formatBogotaTime,
} from "@/lib/attendance-time";
import type { PublicAttendanceRecord } from "@/types";

interface HistoryListProps {
  records: PublicAttendanceRecord[];
}

const DOT_COLOR: Record<PublicAttendanceRecord["status"], string> = {
  GREEN: "bg-semaforo-green",
  YELLOW: "bg-semaforo-yellow",
  RED: "bg-semaforo-red",
};

export default function HistoryList({ records }: HistoryListProps) {
  if (records.length === 0) {
    return (
      <p className="text-center text-sm text-slate-400">
        Todavía no tienes registros de llegada.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-slate-100">
      {records.map((record) => {
        const registeredAt = new Date(record.registeredAt);
        return (
          <li
            key={record.id}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  DOT_COLOR[record.status]
                }`}
              />
              <span className="text-sm text-slate-700">
                {formatBogotaDate(registeredAt)} ·{" "}
                {formatBogotaTime(registeredAt)}
              </span>
            </div>
            <span className="text-sm font-semibold text-slate-500">
              {ATTENDANCE_STATUS_SHORT_LABELS[record.status]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
