import { bloqueoRepository } from "@/lib/repositories/bloqueo.repository";
import type { BloqueoRepository } from "@/lib/repositories/bloqueo.repository";
import { turnoRepository } from "@/lib/repositories/turno.repository";
import type { TurnoRepository } from "@/lib/repositories/turno.repository";
import { ServiceError } from "@/lib/services/service-error";
export { ServiceError } from "@/lib/services/service-error";

function parseTurnoId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ServiceError("El id de turno debe ser un entero positivo", 400);
  }
  return id;
}

function parseMotivo(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ServiceError("El motivo del bloqueo es obligatorio");
  }
  return value.trim();
}

function ensureObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") {
    throw new ServiceError("Body invalido");
  }
  return body as Record<string, unknown>;
}

export class BloqueoService {
  constructor(
    private readonly repository: BloqueoRepository,
    private readonly turnoRepo: TurnoRepository,
  ) {}

  async bloquearTurno(idParam: string, body: unknown) {
    const id_turno = parseTurnoId(idParam);
    const payload = ensureObject(body);
    const motivo = parseMotivo(payload.motivo);

    // Verificar que el turno existe
    const turno = await this.turnoRepo.findById(id_turno);
    if (!turno) {
      throw new ServiceError("Turno no encontrado", 404);
    }

    // CDU17: no se puede bloquear si tiene reserva activa
    const reserva = await this.turnoRepo.findReservaByTurno(id_turno);
    if (reserva) {
      throw new ServiceError(
        "No se puede bloquear un turno que ya tiene una reserva activa",
        409,
      );
    }

    // Evitar bloqueos duplicados
    const bloqueoExistente = await this.repository.findByTurno(id_turno);
    if (bloqueoExistente) {
      throw new ServiceError("El turno ya se encuentra bloqueado", 409);
    }

    return this.repository.create({ id_turno, motivo });
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
}

export const bloqueoService = new BloqueoService(bloqueoRepository, turnoRepository);