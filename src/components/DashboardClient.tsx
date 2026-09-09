"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TrafficLight from "@/components/TrafficLight";
import HistoryList from "@/components/HistoryList";
import {
  ATTENDANCE_STATUS_LABELS,
  formatBlockTime,
  formatBogotaDate,
  formatBogotaTime,
  formatSecondsAsCountdown,
} from "@/lib/attendance-time";
import type { AttendanceStatus, PublicAttendanceRecord } from "@/types";

type StatusResponse =
  | { type: "NO_SCHOOL_DAY"; serverTime: string }
  | { type: "NO_ACTIVE_BLOCK"; serverTime: string }
  | {
      type: "ACTIVE";
      blockTime: string;
      status: AttendanceStatus;
      minutesAfterStart: number;
      secondsAfterStart: number;
      secondsUntilNextChange: number | null;
      serverTime: string;
      alreadyRegistered: boolean;
      registeredRecord: {
        registeredAt: string;
        status: AttendanceStatus;
        blockTime: string;
      } | null;
    };

interface Confirmation {
  registeredAt: string;
  status: AttendanceStatus;
  blockTime: string;
}

const POLL_INTERVAL_MS = 30_000;

export default function DashboardClient({
  initialHistory,
}: {
  initialHistory: PublicAttendanceRecord[];
}) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [history, setHistory] = useState<PublicAttendanceRecord[]>(initialHistory);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const fetchedAtRef = useRef<number>(Date.now());

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/attendance/status", {
        cache: "no-store",
      });
      if (!response.ok) {
        setStatusError("No fue posible consultar el semáforo.");
        return;
      }
      const data: StatusResponse = await response.json();
      fetchedAtRef.current = Date.now();
      setStatus(data);
      setStatusError(null);
      if (data.type === "ACTIVE") {
        setRemainingSeconds(data.secondsUntilNextChange);
      } else {
        setRemainingSeconds(null);
      }
    } catch {
      setStatusError("No fue posible conectar con el servidor.");
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/attendance/history", {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = await response.json();
      setHistory(data.records);
    } catch {
      // Silencioso: el historial no es crítico para la funcionalidad principal.
    }
  }, []);

  // Carga inicial + resincronización periódica con el servidor.
  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  // Contador local que decrementa cada segundo entre resincronizaciones.
  useEffect(() => {
    if (remainingSeconds === null) return;

    const tick = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return null;
        const next = prev - 1;
        if (next <= 0) {
          // El color está a punto de cambiar: forzar resincronización real.
          refreshStatus();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleRegister() {
    if (isRegistering) return;
    setIsRegistering(true);
    setRegisterError(null);

    try {
      const response = await fetch("/api/attendance/register", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        setRegisterError(data.error ?? "No fue posible registrar la llegada.");
        setIsRegistering(false);
        await refreshStatus();
        return;
      }

      setConfirmation({
        registeredAt: data.record.registeredAt,
        status: data.record.status,
        blockTime: data.record.blockTime,
      });

      await Promise.all([refreshStatus(), refreshHistory()]);
    } catch {
      setRegisterError("No fue posible conectar con el servidor.");
    } finally {
      setIsRegistering(false);
    }
  }

  const isActive = status?.type === "ACTIVE";
  const activeStatusColor = isActive ? status.status : null;
  const alreadyRegistered = isActive && status.alreadyRegistered;
  const canRegister = isActive && !alreadyRegistered && !isRegistering;

  return (
    <div className="flex flex-1 flex-col gap-6 px-5 py-6">
      <section className="card flex flex-col items-center gap-4 py-8">
        <TrafficLight activeStatus={activeStatusColor} />

        <div className="text-center">
          {status === null && !statusError && (
            <p className="text-slate-400">Cargando semáforo...</p>
          )}

          {statusError && <p className="text-red-600">{statusError}</p>}

          {status?.type === "NO_SCHOOL_DAY" && (
            <p className="text-lg font-semibold text-slate-600">
              No hay registro de llegadas disponible hoy.
            </p>
          )}

          {status?.type === "NO_ACTIVE_BLOCK" && (
            <p className="text-lg font-semibold text-slate-600">
              No hay una ventana de llegada activa en este momento.
            </p>
          )}

          {status?.type === "ACTIVE" && (
            <>
              <p className="text-lg font-semibold text-slate-800">
                {ATTENDANCE_STATUS_LABELS[status.status]}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Bloque: {formatBlockTime(status.blockTime)}
              </p>
              {remainingSeconds !== null && status.status !== "RED" && (
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Quedan {formatSecondsAsCountdown(remainingSeconds)}
                </p>
              )}
              {status.alreadyRegistered && status.registeredRecord && (
                <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
                  Ya registraste tu llegada a las{" "}
                  {formatBogotaTime(new Date(status.registeredRecord.registeredAt))}
                  .
                </p>
              )}
            </>
          )}
        </div>

        <button
          onClick={handleRegister}
          disabled={!canRegister}
          className="btn-primary w-full max-w-xs text-lg"
        >
          {isRegistering ? "Registrando..." : "Registrar llegada"}
        </button>

        {registerError && (
          <p className="text-center text-sm text-red-600">{registerError}</p>
        )}

        {confirmation && (
          <div className="w-full max-w-xs rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
            <p className="font-semibold text-emerald-700">
              ✓ Llegada registrada
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              Hora: {formatBogotaTime(new Date(confirmation.registeredAt))}
            </p>
            <p className="text-sm text-emerald-700">
              Estado: {ATTENDANCE_STATUS_LABELS[confirmation.status]}
            </p>
            <p className="text-sm text-emerald-700">
              Bloque: {formatBlockTime(confirmation.blockTime)}
            </p>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="mb-3 text-base font-semibold text-slate-800">
          Mis registros recientes
        </h2>
        <HistoryList records={history} />
      </section>
    </div>
  );
}
