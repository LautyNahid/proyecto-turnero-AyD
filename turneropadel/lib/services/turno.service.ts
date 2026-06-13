import type { EstadoTurno } from "@prisma/client";
import { canchaRepository } from "@/lib/repositories/cancha.repository";
import type { CanchaRepository } from "@/lib/repositories/cancha.repository";
import {
  isKnownPrismaError,
  turnoRepository,
} from "@/lib/repositories/turno.repository";
import type {
  CreateTurnoData,
  TurnoRepository,
  UpdateTurnoData,
} from "@/lib/repositories/turno.repository";
import { ServiceError } from "@/lib/services/service-error";
//Se utiliza esta libreria para facilitar la extensibilidad por si en un futuro se quiere hacer para varios paises.
import { fromZonedTime } from "date-fns-tz";

const TIMEZONE = "America/Argentina/Buenos_Aires";

const ESTADOS_TURNO: EstadoTurno[] = ["Disponible", "Reservado", "EnCurso", "Finalizado"];
const ESTADOS_OCUPADOS: EstadoTurno[] = ["Reservado", "EnCurso", "Finalizado"];

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

function parseTurnoId(value: string): number {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ServiceError("El id de turno debe ser un entero positivo", 400);
  }

  return id;
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

function parseOptionalFecha(value: string | null): Date | undefined {
  if (!value) return undefined;

  return parseFecha(value);
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

function parsePrecio(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new ServiceError("El precio debe ser un numero mayor o igual a cero");
  }

  return value;
}

function parseEstadoTurno(value: unknown): EstadoTurno | undefined {
  if (value === undefined) return undefined;

  if (typeof value !== "string" || !ESTADOS_TURNO.includes(value as EstadoTurno)) {
    throw new ServiceError("El estado de turno enviado no es valido");
  }

  return value as EstadoTurno;
}

export class TurnoService {
  constructor(
    private readonly repository: TurnoRepository,
    private readonly canchaRepo: CanchaRepository,
  ) {}

  obtenerTurnos() {
    return this.repository.findAll();
  }

  obtenerTurnosFiltrados(searchParams: URLSearchParams) {
    const fechaDesde = parseOptionalFecha(searchParams.get("fechaDesde"));
    const fechaHasta = parseOptionalFecha(searchParams.get("fechaHasta"));
    const ocupados = searchParams.get("ocupados") === "true";

    if (!fechaDesde && !fechaHasta && !ocupados) {
      return this.obtenerTurnos();
    }

    return this.repository.findMany({
      fechaDesde,
      fechaHasta,
      estados: ocupados ? ESTADOS_OCUPADOS : undefined,
    });
  }

  async obtenerTurnoPorId(idParam: string) {
    const id_turno = parseTurnoId(idParam);
    const turno = await this.repository.findById(id_turno);

    if (!turno) {
      throw new ServiceError("Turno no encontrado", 404);
    }

    return turno;
  }

  async crearTurno(body: unknown) {
    const payload = ensureObject(body);
    const data: CreateTurnoData = {
      id_cancha: parsePositiveInteger(payload.id_cancha, "id_cancha"),
      fecha: parseFecha(payload.fecha),
      hora: parseHora(payload.hora),
      precio: parsePrecio(payload.precio),
      estado_turno: "Reservado",
    };
    await this.ensureCanchaExists(data.id_cancha);
    await this.ensureHorarioDisponible(data);

    return this.repository.create(data);
  }

  async modificarTurno(idParam: string, body: unknown) {
    const id_turno = parseTurnoId(idParam);
    const payload = ensureObject(body);
    const data = this.parseUpdateData(payload);

    if (Object.keys(data).length === 0) {
      throw new ServiceError("Debe enviar al menos un dato para modificar");
    }

    const turno = await this.repository.findById(id_turno);
    if (!turno) {
      throw new ServiceError("Turno no encontrado", 404);
    }

    if (data.id_cancha !== undefined) {
      await this.ensureCanchaExists(data.id_cancha);
    }

    const schedule = {
      id_cancha: data.id_cancha ?? turno.id_cancha,
      fecha: data.fecha ?? turno.fecha,
      hora: data.hora ?? turno.hora,
    };

    if (
      schedule.id_cancha !== turno.id_cancha ||
      schedule.fecha.getTime() !== turno.fecha.getTime() ||
      schedule.hora !== turno.hora
    ) {
      await this.ensureHorarioDisponible(schedule, id_turno);
    }

    return this.repository.update(id_turno, data);
  }

  async eliminarTurno(idParam: string) {
    const id_turno = parseTurnoId(idParam);
    const turno = await this.repository.findById(id_turno);

    if (!turno) {
      throw new ServiceError("Turno no encontrado", 404);
    }

    try {
      await this.repository.delete(id_turno);
    } catch (error) {
      if (isKnownPrismaError(error, "P2003")) {
        throw new ServiceError("No se puede eliminar un turno con registros asociados", 409);
      }

      throw error;
    }
  }

  private async ensureCanchaExists(id_cancha: number) {
    const cancha = await this.canchaRepo.findById(id_cancha);

    if (!cancha) {
      throw new ServiceError("La cancha indicada no existe", 404);
    }
  }

  private async ensureHorarioDisponible(
    schedule: { id_cancha: number; fecha: Date; hora: string },
    idTurnoActual?: number,
  ) {
    const turnoExistente = await this.repository.findBySchedule(schedule);

    if (turnoExistente && turnoExistente.id_turno !== idTurnoActual) {
      throw new ServiceError("Ya existe un turno para esa cancha, fecha y hora", 409);
    }
  }

  private parseUpdateData(payload: Record<string, unknown>): UpdateTurnoData {
    const data: UpdateTurnoData = {};

    if ("id_cancha" in payload) {
      data.id_cancha = parsePositiveInteger(payload.id_cancha, "id_cancha");
    }

    if ("fecha" in payload) {
      data.fecha = parseFecha(payload.fecha);
    }

    if ("hora" in payload) {
      data.hora = parseHora(payload.hora);
    }

    if ("precio" in payload) {
      data.precio = parsePrecio(payload.precio);
    }

    if ("estado_turno" in payload) {
      data.estado_turno = parseEstadoTurno(payload.estado_turno);
    }

    return data;
  }
}

export const turnoService = new TurnoService(turnoRepository, canchaRepository);
