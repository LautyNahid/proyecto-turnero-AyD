import {
  canchaRepository,
  isKnownPrismaError,
} from "@/lib/repositories/cancha.repository";
import type {
  CanchaRepository,
  CreateCanchaData,
  UpdateCanchaData,
} from "@/lib/repositories/cancha.repository";
import { ServiceError } from "@/lib/services/service-error";
export { ServiceError } from "@/lib/services/service-error";

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

function parseCanchaId(value: string): number {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ServiceError("El id de cancha debe ser un entero positivo", 400);
  }

  return id;
}

export class CanchaService {
  constructor(private readonly repository: CanchaRepository) {}

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
  await this.obtenerCanchaPorId(idParam); // valida que la cancha exista (404 si no)

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

    return this.repository.update(id_cancha, data);
  }

  async eliminarCancha(idParam: string) {
    const id_cancha = parseCanchaId(idParam);
    const cancha = await this.repository.findById(id_cancha);

    if (!cancha) {
      throw new ServiceError("Cancha no encontrada", 404);
    }

    try {
      await this.repository.delete(id_cancha);
    } catch (error) {
      if (isKnownPrismaError(error, "P2003")) {
        throw new ServiceError("No se puede eliminar una cancha con turnos asociados", 409);
      }

      throw error;
    }
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

    return data;
  }
}

export const canchaService = new CanchaService(canchaRepository);
