import type { AttendanceStatus } from "@/types";

// ============================================================
// FUENTE ÚNICA DE VERDAD para:
//   - horarios (inicios de bloque)
//   - ventanas de tiempo (verde / amarillo / rojo)
//   - zona horaria (America/Bogota)
//   - determinación de días sin clase
//
// NINGÚN otro archivo debe duplicar esta lógica. Todo cálculo de
// hora/estado de asistencia debe pasar por las funciones de aquí.
//
// IMPORTANTE: nunca confiar en la hora del navegador del cliente.
// getBogotaNow() siempre se calcula a partir de la hora del
// servidor (new Date()), nunca a partir de un valor enviado por
// el cliente.
// ============================================================

/**
 * Colombia (America/Bogota) usa un desfase fijo de UTC-5 durante
 * todo el año: no observa horario de verano (DST). Por eso podemos
 * calcular la hora local de forma determinística restando 5 horas
 * a la hora UTC, sin depender de bases de datos de zonas horarias
 * del sistema operativo/runtime.
 */
const BOGOTA_UTC_OFFSET_HOURS = -5;

export const BOGOTA_TIMEZONE = "America/Bogota";

/**
 * Horas de inicio de cada bloque académico, usadas ÚNICAMENTE
 * como parámetros internos para calcular el semáforo de llegadas.
 *
 * NO representan materias, ni deben mostrarse como un horario
 * académico visual en ninguna parte de la interfaz.
 */
export const BLOCK_START_TIMES = [
  "06:30",
  "07:25",
  "08:20",
  "09:45",
  "10:40",
  "11:35",
  "13:00",
  "13:55",
  "15:10",
  "16:05",
  "17:00",
] as const;

export type BlockTime = (typeof BLOCK_START_TIMES)[number];

/** Duración de la ventana "verde" (llegada a tiempo), en segundos. */
const GREEN_WINDOW_SECONDS = 10 * 60;

/** Fin de la ventana "amarilla" (advertencia), en segundos desde el inicio del bloque. */
const YELLOW_WINDOW_END_SECONDS = 12 * 60;

/** Segundos en un día completo. */
const SECONDS_PER_DAY = 24 * 60 * 60;

export interface BogotaNow {
  /** Instante UTC real usado para el cálculo (referencia, para depuración). */
  utcDate: Date;
  year: number;
  month: number; // 1-12
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** 0 = domingo, 1 = lunes, ..., 6 = sábado (según hora de Bogotá). */
  dayOfWeek: number;
  /** Fecha en formato YYYY-MM-DD (hora de Bogotá). */
  dateString: string;
  /** Segundos transcurridos desde la medianoche (hora de Bogotá). */
  totalSecondsSinceMidnight: number;
}

/**
 * Calcula la fecha/hora actual en la zona horaria de Bogotá a partir
 * de la hora del servidor. Nunca debe recibir una fecha proveniente
 * del cliente/navegador.
 */
export function getBogotaNow(referenceDate: Date = new Date()): BogotaNow {
  const shifted = new Date(
    referenceDate.getTime() + BOGOTA_UTC_OFFSET_HOURS * 60 * 60 * 1000
  );

  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const hours = shifted.getUTCHours();
  const minutes = shifted.getUTCMinutes();
  const seconds = shifted.getUTCSeconds();
  const dayOfWeek = shifted.getUTCDay();

  const pad = (n: number) => String(n).padStart(2, "0");
  const dateString = `${year}-${pad(month)}-${pad(day)}`;
  const totalSecondsSinceMidnight = hours * 3600 + minutes * 60 + seconds;

  return {
    utcDate: referenceDate,
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    dayOfWeek,
    dateString,
    totalSecondsSinceMidnight,
  };
}

function blockTimeToSeconds(blockTime: string): number {
  const [h, m] = blockTime.split(":").map(Number);
  return h * 3600 + m * 60;
}

/** true si el día (según Bogotá) es sábado o domingo. */
export function isNonSchoolDay(now: BogotaNow): boolean {
  return now.dayOfWeek === 0 || now.dayOfWeek === 6;
}

export type AttendanceCalculationResult =
  | {
      type: "ACTIVE";
      blockTime: BlockTime;
      status: AttendanceStatus;
      minutesAfterStart: number;
      secondsAfterStart: number;
      /** Segundos restantes hasta el próximo cambio de color (null si ya está en rojo). */
      secondsUntilNextChange: number | null;
    }
  | { type: "NO_ACTIVE_BLOCK" }
  | { type: "NO_SCHOOL_DAY" };

/**
 * Función central que determina, para un instante dado (siempre
 * calculado en el servidor), a qué bloque corresponde una llegada
 * y qué color de semáforo le corresponde.
 *
 * La "ventana" de un bloque comienza en su hora de inicio y se
 * extiende hasta justo antes del inicio del siguiente bloque (o
 * hasta el final del día para el último bloque). Dentro de esa
 * ventana:
 *   - primeros 10 minutos           -> GREEN  (a tiempo)
 *   - minutos 10 a 12               -> YELLOW (advertencia)
 *   - de ahí en adelante            -> RED    (tarde)
 *
 * Esto evita inventar un bloque quando no corresponde (por ejemplo,
 * de madrugada antes del primer bloque) y evita asociar
 * accidentalmente una llegada con un bloque anterior una vez que
 * empieza el siguiente.
 */
export function calculateAttendanceStatus(
  now: BogotaNow
): AttendanceCalculationResult {
  if (isNonSchoolDay(now)) {
    return { type: "NO_SCHOOL_DAY" };
  }

  const nowSeconds = now.totalSecondsSinceMidnight;
  const blockStarts = BLOCK_START_TIMES.map(blockTimeToSeconds);

  if (nowSeconds < blockStarts[0]) {
    return { type: "NO_ACTIVE_BLOCK" };
  }

  for (let i = 0; i < BLOCK_START_TIMES.length; i++) {
    const startSeconds = blockStarts[i];
    const windowEndSeconds =
      i < blockStarts.length - 1 ? blockStarts[i + 1] : SECONDS_PER_DAY;

    if (nowSeconds >= startSeconds && nowSeconds < windowEndSeconds) {
      const secondsAfterStart = nowSeconds - startSeconds;
      const minutesAfterStart = Math.floor(secondsAfterStart / 60);

      let status: AttendanceStatus;
      let secondsUntilNextChange: number | null;

      if (secondsAfterStart < GREEN_WINDOW_SECONDS) {
        status = "GREEN";
        secondsUntilNextChange = GREEN_WINDOW_SECONDS - secondsAfterStart;
      } else if (secondsAfterStart < YELLOW_WINDOW_END_SECONDS) {
        status = "YELLOW";
        secondsUntilNextChange = YELLOW_WINDOW_END_SECONDS - secondsAfterStart;
      } else {
        status = "RED";
        secondsUntilNextChange = null;
      }

      return {
        type: "ACTIVE",
        blockTime: BLOCK_START_TIMES[i],
        status,
        minutesAfterStart,
        secondsAfterStart,
        secondsUntilNextChange,
      };
    }
  }

  // No debería llegar aquí porque el último bloque cubre hasta el
  // final del día, pero se mantiene como salvaguarda.
  return { type: "NO_ACTIVE_BLOCK" };
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  GREEN: "Llegada a tiempo",
  YELLOW: "Periodo de advertencia",
  RED: "Llegada tarde",
};

export const ATTENDANCE_STATUS_SHORT_LABELS: Record<AttendanceStatus, string> = {
  GREEN: "A tiempo",
  YELLOW: "Advertencia",
  RED: "Tarde",
};

/** Formatea segundos restantes como "4 min 32 s". */
export function formatSecondsAsCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes} min ${String(seconds).padStart(2, "0")} s`;
}

/** Formatea una fecha ISO/Date como hora en formato "7:28 a. m." (hora de Bogotá). */
export function formatBogotaTime(date: Date): string {
  const now = getBogotaNow(date);
  const hour24 = now.hours;
  const period = hour24 < 12 ? "a. m." : "p. m.";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  const minutes = String(now.minutes).padStart(2, "0");
  return `${hour12}:${minutes} ${period}`;
}

/** Formatea una fecha ISO/Date como "8 sep 2026" (hora de Bogotá). */
const MONTHS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export function formatBogotaDate(date: Date): string {
  const now = getBogotaNow(date);
  return `${now.day} ${MONTHS_ES[now.month - 1]} ${now.year}`;
}

/** Formatea una hora de bloque "HH:MM" (24h) a formato "7:25 a. m." */
export function formatBlockTime(blockTime: string): string {
  const [h, m] = blockTime.split(":").map(Number);
  const period = h < 12 ? "a. m." : "p. m.";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}
