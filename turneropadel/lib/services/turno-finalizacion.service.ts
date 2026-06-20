import type { EstadoTurno } from "@prisma/client";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { turnoRepository } from "@/lib/repositories/turno.repository";
import type {
  TurnoFinalizacionCandidate,
  TurnoRepository,
} from "@/lib/repositories/turno.repository";

const TIMEZONE = "America/Argentina/Buenos_Aires";
const DURACION_TURNO_MINUTOS = 90;
const ESTADOS_FINALIZABLES: EstadoTurno[] = ["Reservado", "EnCurso"];
const ESTADO_FINAL = "Finalizado";

export type FinalizarTurnosResult = {
  finalizados: number;
  ids: number[];
};

function getFechaKey(fecha: Date) {
  return fecha.toISOString().slice(0, 10);
}

function getFechaHoraFinTurno(fecha: Date, hora: string) {
  const inicio = fromZonedTime(`${getFechaKey(fecha)}T${hora}:00`, TIMEZONE);
  return new Date(inicio.getTime() + DURACION_TURNO_MINUTOS * 60 * 1000);
}

function getFechaArgentinaInicioDelDia(now: Date) {
  const fechaArgentina = formatInTimeZone(now, TIMEZONE, "yyyy-MM-dd");
  return fromZonedTime(`${fechaArgentina}T00:00:00`, TIMEZONE);
}

function turnoYaFinalizo(turno: TurnoFinalizacionCandidate, now: Date) {
  return getFechaHoraFinTurno(turno.fecha, turno.hora).getTime() <= now.getTime();
}

export class TurnoFinalizacionService {
  constructor(private readonly repository: TurnoRepository) {}

  async finalizarTurnosVencidos(now = new Date()): Promise<FinalizarTurnosResult> {
    const fechaHoyArgentina = getFechaArgentinaInicioDelDia(now);
    const turnosCandidatos = await this.repository.findFinalizacionCandidates(
      ESTADOS_FINALIZABLES,
      fechaHoyArgentina,
    );
    const idsFinalizables = turnosCandidatos
      .filter((turno) => turnoYaFinalizo(turno, now))
      .map((turno) => turno.id_turno);

    const finalizados = await this.repository.updateManyEstado(idsFinalizables, ESTADO_FINAL);

    return {
      finalizados,
      ids: idsFinalizables,
    };
  }
}

export const turnoFinalizacionService = new TurnoFinalizacionService(turnoRepository);
