import { canchaRepository } from "@/lib/repositories/cancha.repository";
import type { CanchaRepository } from "@/lib/repositories/cancha.repository";
import { jugadorRepository } from "@/lib/repositories/jugador.repository";
import type { JugadorRepository } from "@/lib/repositories/jugador.repository";
import {
  isKnownPrismaError,
  reservaRepository,
} from "@/lib/repositories/reserva.repository";
import type {
  CreateReservaData,
  CreateReservaWithTurnoData,
  ReservaRepository,
} from "@/lib/repositories/reserva.repository";
import { turnoRepository } from "@/lib/repositories/turno.repository";
import type { TurnoRepository } from "@/lib/repositories/turno.repository";
import { ServiceError } from "@/lib/services/service-error";
import { fromZonedTime } from "date-fns-tz";

const TIMEZONE = "America/Argentina/Buenos_Aires";
const TURNOS_OCUPADOS = ["Reservado", "EnCurso", "Finalizado"];
const HORA_INICIO_RECARGO = "18:00";
const RECARGO_HORARIO_PICO = 1.10;

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

function parseTurnoIdFromLobby(value: unknown): number {
  return parsePositiveInteger(value, "id_turno");
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

function calcularFechaHoraTurno(fecha: Date, hora: string): Date {
  const fechaStr = fecha.toISOString().slice(0, 10);
  return fromZonedTime(`${fechaStr}T${hora}:00`, TIMEZONE);
}

function parsePrecio(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new ServiceError("El precio debe ser un numero mayor o igual a cero");
  }

  return value;
}

export class ReservaService {
  constructor(
    private readonly repository: ReservaRepository,
    private readonly turnoRepo: TurnoRepository,
    private readonly jugadorRepo: JugadorRepository,
    private readonly canchaRepo: CanchaRepository,
  ) {}

  obtenerReservas() {
    return this.repository.findAll();
  }

  obtenerReservasPorJugador(id_jugador: string) {
    return this.repository.findByJugadorId(id_jugador);
  }

  async obtenerReservaPorId(idParam: string) {
    const id_reserva = parseReservaId(idParam);
    const reserva = await this.repository.findById(id_reserva);

    if (!reserva) {
      throw new ServiceError("Reserva no encontrada", 404);
    }

    return reserva;
  }

  async crearReserva(body: unknown, idJugadorAutenticado?: string) {
  const payload = ensureObject(body);

  if ("id_lobby" in payload) {
    return this.crearReservaDesdeLobby(payload, idJugadorAutenticado);
  }

  const id_jugador = idJugadorAutenticado ?? parseJugadorId(payload.id_jugador);

  await this.ensureJugadorExists(id_jugador);

  try {
    if ("id_turno" in payload) {
      const data: CreateReservaData = {
        id_jugador,
        id_turno: parsePositiveInteger(payload.id_turno, "id_turno"),
      };

      await this.ensureTurnoReservable(data.id_turno);

      return await this.repository.create(data);
    }

    const data: CreateReservaWithTurnoData = {
      id_jugador,
      id_cancha: parsePositiveInteger(payload.id_cancha, "id_cancha"),
      fecha: parseFecha(payload.fecha),
      hora: parseHora(payload.hora),
      precio: parsePrecio(payload.precio),
    };

    await this.ensureCanchaExists(data.id_cancha);

    const turnoExistente = await this.turnoRepo.findBySchedule({
      id_cancha: data.id_cancha,
      fecha: data.fecha,
      hora: data.hora,
    });

    if (turnoExistente) {
      if (TURNOS_OCUPADOS.includes(turnoExistente.estado_turno)) {
        throw new ServiceError("El turno no esta disponible para reservar", 409);
      }

      await this.ensureTurnoSinReserva(turnoExistente.id_turno);

      return await this.repository.create({
        id_jugador,
        id_turno: turnoExistente.id_turno,
      });
    }

    return await this.repository.createWithTurno(data);
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

private async crearReservaDesdeLobby(payload: Record<string, unknown>, idJugadorAutenticado?: string) {
  const id_lobby = parsePositiveInteger(payload.id_lobby, "id_lobby");
  const id_turno = parseTurnoIdFromLobby(payload.id_turno);
  const id_jugador = idJugadorAutenticado ?? parseJugadorId(payload.id_jugador);

  await this.ensureJugadorExists(id_jugador);
  await this.ensureTurnoBloqueadoPorLobby(id_turno, id_lobby);

  try {
    return await this.repository.create({ id_jugador, id_turno });
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

private async ensureTurnoBloqueadoPorLobby(id_turno: number, id_lobby: number) {
  const turno = await this.turnoRepo.findById(id_turno);

  if (!turno) {
    throw new ServiceError("El turno indicado no existe", 404);
  }

  if (turno.estado_turno !== "Reservado") {
    throw new ServiceError(
      `El turno no está bloqueado por el lobby ${id_lobby}`,
      409
    );
  }

  await this.ensureTurnoSinReserva(id_turno);
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

  private async obtenerCanchaConPrecio(id_cancha: number) {
    const cancha = await this.canchaRepo.findById(id_cancha);

    if (!cancha) {
      throw new ServiceError("La cancha indicada no existe", 404);
    }

    if (cancha.precio === null || cancha.precio === undefined) {
      throw new ServiceError("La cancha no tiene un precio base configurado", 422);
    }

    return cancha;
  }

  private async ensureCanchaExists(id_cancha: number) {
    const cancha = await this.canchaRepo.findById(id_cancha);

    if (!cancha) {
      throw new ServiceError("La cancha indicada no existe", 404);
    }
  }

  private async ensureTurnoReservable(id_turno: number) {
    const turno = await this.turnoRepo.findById(id_turno);

    if (!turno) {
      throw new ServiceError("El turno indicado no existe", 404);
    }

    if (TURNOS_OCUPADOS.includes(turno.estado_turno)) {
      throw new ServiceError("El turno no esta disponible para reservar", 409);
    }

    await this.ensureTurnoSinReserva(id_turno);

    return turno;
  }

  private async ensureTurnoSinReserva(id_turno: number) {
    const reservaExistente = await this.repository.findByTurnoId(id_turno);

    if (reservaExistente) {
      throw new ServiceError("El turno ya tiene una reserva asociada", 409);
    }
  }
}

export const reservaService = new ReservaService(reservaRepository, turnoRepository, jugadorRepository, canchaRepository);