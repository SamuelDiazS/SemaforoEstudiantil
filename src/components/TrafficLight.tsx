import type { AttendanceStatus } from "@/types";

interface TrafficLightProps {
  /** null = ningún color encendido (por ejemplo, sin ventana activa) */
  activeStatus: AttendanceStatus | null;
}

const CIRCLE_ORDER: AttendanceStatus[] = ["RED", "YELLOW", "GREEN"];

const CIRCLE_STYLES: Record<
  AttendanceStatus,
  { on: string; off: string; glow: string }
> = {
  RED: {
    on: "bg-semaforo-red",
    off: "bg-semaforo-redDim",
    glow: "shadow-[0_0_28px_6px_rgba(239,68,68,0.55)]",
  },
  YELLOW: {
    on: "bg-semaforo-yellow",
    off: "bg-semaforo-yellowDim",
    glow: "shadow-[0_0_28px_6px_rgba(234,179,8,0.55)]",
  },
  GREEN: {
    on: "bg-semaforo-green",
    off: "bg-semaforo-greenDim",
    glow: "shadow-[0_0_28px_6px_rgba(34,197,94,0.55)]",
  },
};

export default function TrafficLight({ activeStatus }: TrafficLightProps) {
  return (
    <div
      className="mx-auto flex w-fit flex-col items-center gap-4 rounded-[2rem] bg-slate-900 p-5 shadow-lg"
      role="img"
      aria-label={
        activeStatus
          ? `Semáforo en ${activeStatus.toLowerCase()}`
          : "Semáforo apagado"
      }
    >
      {CIRCLE_ORDER.map((color) => {
        const isOn = activeStatus === color;
        const styles = CIRCLE_STYLES[color];
        return (
          <div
            key={color}
            className={`h-20 w-20 rounded-full transition-all duration-300 sm:h-24 sm:w-24 ${
              isOn ? `${styles.on} ${styles.glow}` : styles.off
            }`}
          />
        );
      })}
    </div>
  );
}
