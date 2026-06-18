import { canchaRepository } from "@/lib/repositories/cancha.repository";
import type {
  CanchaRepository,
  CreateCanchaData,
  UpdateCanchaData,
} from "@/lib/repositories/cancha.repository";
import { turnoRepository } from "@/lib/repositories/turno.repository";
import type { TurnoRepository } from "@/lib/repositories/turno.repository";
import { ServiceError } from "@/lib/services/service-error";
export { ServiceError } from "@/lib/services/service-error";
import { fromZonedTime } from "date-fns-tz";

const TIMEZONE = "America/Argentina/Buenos_Aires";

function hoyArgentina(): Date {
  const fechaLocal = new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE });
  return fromZonedTime(`${fechaLocal}T00:00:00`, TIMEZONE);
}

function ensureObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") {
    throw new ServiceError("Body invalido");
  }
  return body as Record<string, unknown>;
}

function parseNumeroCancha(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new ServiceError("El numero de cancha debe ser un entero positivo");
  }
  return value;
}

function parseActiva(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new ServiceError("El estado activa debe ser booleano");
  }
  return value;
}

function parsePrecio(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new ServiceError("El precio debe ser un numero mayor o igual a cero");
  }
  return value;
}

function parseCanchaId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ServiceError("El id de cancha debe ser un entero positivo", 400);
  }
  return id;
}

export class CanchaService {
  constructor(
    private readonly repository: CanchaRepository,
    private readonly turnoRepo: TurnoRepository,
  ) {}

  obtenerCanchas() {
    return this.repository.findAll();
  }

  async obtenerCanchaPorId(idParam: string) {
    const id_cancha = parseCanchaId(idParam);
    const cancha = await this.repository.findById(id_cancha);
    if (!cancha) {
      throw new ServiceError("Cancha no encontrada", 404);
    }
    return cancha;
  }

  async obtenerUbicacion(idParam: string) {
    await this.obtenerCanchaPorId(idParam);
    const latitud = process.env.COMPLEJO_LATITUD;
    const longitud = process.env.COMPLEJO_LONGITUD;
    if (!latitud || !longitud) {
      throw new ServiceError("La ubicacion del complejo no esta configurada", 500);
    }
    return {
      latitud: Number(latitud),
      longitud: Number(longitud),
    };
  }

  async crearCancha(body: unknown) {
    const payload = ensureObject(body);
    const data: CreateCanchaData = {
      nro_cancha: parseNumeroCancha(payload.nro_cancha),
    };

    const activa = parseActiva(payload.activa);
    if (activa !== undefined) {
      data.activa = activa;
    }

    if ("precio" in payload && payload.precio !== undefined) {
      data.precio = parsePrecio(payload.precio);
    }

    await this.ensureNumeroDisponible(data.nro_cancha);
    return this.repository.create(data);
  }

  async modificarCancha(idParam: string, body: unknown) {
    const id_cancha = parseCanchaId(idParam);
    const payload = ensureObject(body);
    const data = this.parseUpdateData(payload);

    if (Object.keys(data).length === 0) {
      throw new ServiceError("Debe enviar al menos un dato para modificar");
    }

    const cancha = await this.repository.findById(id_cancha);
    if (!cancha) {
      throw new ServiceError("Cancha no encontrada", 404);
    }

    if (data.nro_cancha !== undefined && data.nro_cancha !== cancha.nro_cancha) {
      await this.ensureNumeroDisponible(data.nro_cancha);
    }

    const canchaActualizada = await this.repository.update(id_cancha, data);

    // RF17: propagar precio a turnos futuros Disponibles (no toca Reservados ni confirmados)
    if (data.precio !== undefined) {
      await this.turnoRepo.updatePrecioDisponibles(id_cancha, data.precio, hoyArgentina());
    }

    return canchaActualizada;
  }

  async eliminarCancha(idParam: string) {
    const id_cancha = parseCanchaId(idParam);
    const cancha = await this.repository.findById(id_cancha);

    if (!cancha) {
      throw new ServiceError("Cancha no encontrada", 404);
    }

    // CDU7/RN13: baja lógica — bloquear si hay reservas futuras activas
    const tieneReservasFuturas = await this.repository.hasReservasFuturas(
      id_cancha,
      hoyArgentina(),
    );
    if (tieneReservasFuturas) {
      throw new ServiceError(
        "La cancha tiene reservas futuras activas. Cancelalas o reubicalas antes de darla de baja.",
        409,
      );
    }

    return this.repository.update(id_cancha, { activa: false });
  }

  private async ensureNumeroDisponible(nro_cancha: number) {
    const canchaExistente = await this.repository.findByNumero(nro_cancha);
    if (canchaExistente) {
      throw new ServiceError("Ya existe una cancha con ese numero", 409);
    }
  }

  private parseUpdateData(payload: Record<string, unknown>): UpdateCanchaData {
    const data: UpdateCanchaData = {};

    if ("nro_cancha" in payload) {
      data.nro_cancha = parseNumeroCancha(payload.nro_cancha);
    }

    if ("activa" in payload) {
      data.activa = parseActiva(payload.activa);
    }

    if ("precio" in payload) {
      data.precio = parsePrecio(payload.precio);
    }

    return data;
  }
}

export const canchaService = new CanchaService(canchaRepository, turnoRepository);