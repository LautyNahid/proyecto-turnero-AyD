import { jugadorRepository } from "@/lib/repositories/jugador.repository";
import type { JugadorRepository } from "@/lib/repositories/jugador.repository";
import {
  isKnownPrismaError,
  reservaRepository,
} from "@/lib/repositories/reserva.repository";
import type {
  CreateReservaData,
  ReservaRepository,
} from "@/lib/repositories/reserva.repository";
import { turnoRepository } from "@/lib/repositories/turno.repository";
import type { TurnoRepository } from "@/lib/repositories/turno.repository";
import { ServiceError } from "@/lib/services/service-error";

function ensureObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") {
    throw new ServiceError("Body invalido");
  }

  return body as Record<string, unknown>;
}

function parsePositiveInteger(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new ServiceError(`${fieldName} debe ser un entero positivo`);
  }

  return value;
}

function parseReservaId(value: string): number {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ServiceError("El id de reserva debe ser un entero positivo", 400);
  }

  return id;
}

function parseJugadorId(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ServiceError("id_jugador es obligatorio");
  }

  return value.trim();
}

export class ReservaService {
  constructor(
    private readonly repository: ReservaRepository,
    private readonly turnoRepo: TurnoRepository,
    private readonly jugadorRepo: JugadorRepository,
  ) {}

  obtenerReservas() {
    return this.repository.findAll();
  }

  async obtenerReservaPorId(idParam: string) {
    const id_reserva = parseReservaId(idParam);
    const reserva = await this.repository.findById(id_reserva);

    if (!reserva) {
      throw new ServiceError("Reserva no encontrada", 404);
    }

    return reserva;
  }

  async crearReserva(body: unknown) {
    const payload = ensureObject(body);
    const data: CreateReservaData = {
      id_jugador: parseJugadorId(payload.id_jugador),
      id_turno: parsePositiveInteger(payload.id_turno, "id_turno"),
    };

    await this.ensureJugadorExists(data.id_jugador);
    await this.ensureTurnoDisponible(data.id_turno);

    try {
      return await this.repository.create(data);
    } catch (error) {
      if (isKnownPrismaError(error, "P2002")) {
        throw new ServiceError("El turno ya tiene una reserva asociada", 409);
      }

      if (isKnownPrismaError(error, "P2003")) {
        throw new ServiceError("Jugador o turno inexistente", 404);
      }

      throw error;
    }
  }

  async eliminarReserva(idParam: string) {
    const id_reserva = parseReservaId(idParam);
    const reserva = await this.repository.findById(id_reserva);

    if (!reserva) {
      throw new ServiceError("Reserva no encontrada", 404);
    }

    try {
      await this.repository.delete(id_reserva);
    } catch (error) {
      if (isKnownPrismaError(error, "P2003")) {
        throw new ServiceError("No se puede eliminar una reserva con registros asociados", 409);
      }

      throw error;
    }
  }

  private async ensureJugadorExists(id_jugador: string) {
    const jugador = await this.jugadorRepo.findById(id_jugador);

    if (!jugador) {
      throw new ServiceError("El jugador indicado no existe", 404);
    }
  }

  private async ensureTurnoDisponible(id_turno: number) {
    const turno = await this.turnoRepo.findById(id_turno);

    if (!turno) {
      throw new ServiceError("El turno indicado no existe", 404);
    }

    if (turno.estado_turno !== "Disponible") {
      throw new ServiceError("El turno no esta disponible para reservar", 409);
    }

    const reservaExistente = await this.repository.findByTurnoId(id_turno);

    if (reservaExistente) {
      throw new ServiceError("El turno ya tiene una reserva asociada", 409);
    }
  }
}

export const reservaService = new ReservaService(reservaRepository, turnoRepository, jugadorRepository);
