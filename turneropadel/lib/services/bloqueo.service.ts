import { canchaRepository } from "@/lib/repositories/cancha.repository";
import type { CanchaRepository } from "@/lib/repositories/cancha.repository";
import { bloqueoRepository } from "@/lib/repositories/bloqueo.repository";
import type { BloqueoRepository } from "@/lib/repositories/bloqueo.repository";
import { turnoRepository } from "@/lib/repositories/turno.repository";
import type { TurnoRepository } from "@/lib/repositories/turno.repository";
import { ServiceError } from "@/lib/services/service-error";
export { ServiceError } from "@/lib/services/service-error";
import { fromZonedTime } from "date-fns-tz";

const TIMEZONE = "America/Argentina/Buenos_Aires";

function ensureObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") {
    throw new ServiceError("Body invalido");
  }
  return body as Record<string, unknown>;
}

function parseTurnoId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ServiceError("El id de turno debe ser un entero positivo", 400);
  }
  return id;
}

function parsePositiveInteger(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new ServiceError(`${fieldName} debe ser un entero positivo`);
  }
  return value;
}

function parseFecha(value: unknown): Date {
  if (typeof value !== "string") {
    throw new ServiceError("La fecha debe enviarse como string en formato YYYY-MM-DD");
  }
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateOnlyPattern.test(value)) {
    throw new ServiceError("La fecha debe tener formato YYYY-MM-DD");
  }
  const fecha = fromZonedTime(`${value}T00:00:00`, TIMEZONE);
  if (Number.isNaN(fecha.getTime())) {
    throw new ServiceError("La fecha enviada es invalida");
  }
  return fecha;
}

function parseHora(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ServiceError("La hora es obligatoria");
  }
  const hora = value.trim();
  const horaPattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!horaPattern.test(hora)) {
    throw new ServiceError("La hora debe tener formato HH:mm");
  }
  return hora;
}

function parseMotivo(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ServiceError("El motivo del bloqueo es obligatorio");
  }
  return value.trim();
}

export class BloqueoService {
  constructor(
    private readonly repository: BloqueoRepository,
    private readonly turnoRepo: TurnoRepository,
    private readonly canchaRepo: CanchaRepository,
  ) {}

  async bloquearTurno(idParam: string, body: unknown) {
    const id_turno = parseTurnoId(idParam);
    const payload = ensureObject(body);
    const motivo = parseMotivo(payload.motivo);

    const turno = await this.turnoRepo.findById(id_turno);
    if (!turno) {
      throw new ServiceError("Turno no encontrado", 404);
    }

    await this.ensureTurnoBloqueable(id_turno);

    return this.repository.create({ id_turno, motivo });
  }

  async bloquearPorHorario(body: unknown) {
    const payload = ensureObject(body);
    const id_cancha = parsePositiveInteger(payload.id_cancha, "id_cancha");
    const fecha = parseFecha(payload.fecha);
    const hora = parseHora(payload.hora);
    const motivo = parseMotivo(payload.motivo);

    const cancha = await this.canchaRepo.findById(id_cancha);
    if (!cancha) {
      throw new ServiceError("La cancha indicada no existe", 404);
    }

    let turno = await this.turnoRepo.findBySchedule({ id_cancha, fecha, hora });

    if (turno) {
      await this.ensureTurnoBloqueable(turno.id_turno);
    } else {
      if (cancha.precio === null || cancha.precio === undefined) {
        throw new ServiceError(
          "La cancha no tiene un precio base configurado, no se puede crear el turno",
          422,
        );
      }

      turno = await this.turnoRepo.create({ id_cancha, fecha, hora, precio: cancha.precio });
    }

    return this.repository.create({ id_turno: turno.id_turno, motivo });
  }

  async desbloquearTurno(idParam: string) {
    const id_turno = parseTurnoId(idParam);

    const turno = await this.turnoRepo.findById(id_turno);
    if (!turno) {
      throw new ServiceError("Turno no encontrado", 404);
    }

    const bloqueo = await this.repository.findByTurno(id_turno);
    if (!bloqueo) {
      throw new ServiceError("El turno no tiene un bloqueo activo", 404);
    }

    return this.repository.deleteById(bloqueo.id_bloqueo);
  }

  private async ensureTurnoBloqueable(id_turno: number) {
    const reserva = await this.turnoRepo.findReservaByTurno(id_turno);
    if (reserva) {
      throw new ServiceError(
        "No se puede bloquear un turno que ya tiene una reserva activa",
        409,
      );
    }

    const bloqueoExistente = await this.repository.findByTurno(id_turno);
    if (bloqueoExistente) {
      throw new ServiceError("El turno ya se encuentra bloqueado", 409);
    }
  }
}

export const bloqueoService = new BloqueoService(bloqueoRepository, turnoRepository, canchaRepository);