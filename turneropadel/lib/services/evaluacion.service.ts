import { evaluacionRepository, isKnownPrismaError } from "@/lib/repositories/evaluacion.repository";
import { ServiceError } from "@/lib/services/service-error";
import { db } from "@/lib/db";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parsePuntaje(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
    throw new ServiceError("El puntaje debe ser un entero entre 1 y 5", 400);
  }
  return value;
}

function parsePositiveInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new ServiceError(`${field} debe ser un entero positivo`, 400);
  }
  return value;
}

function ensureObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") {
    throw new ServiceError("Body inválido", 400);
  }
  return body as Record<string, unknown>;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class EvaluacionService {

  async evaluarJugador(body: unknown, id_evaluador: string) {
    const payload = ensureObject(body);

    const id_evaluado = this.parseIdEvaluado(payload.id_evaluado);
    const id_reserva = parsePositiveInteger(payload.id_reserva, "id_reserva");
    const puntaje = parsePuntaje(payload.puntaje);

    if (id_evaluador === id_evaluado) {
      throw new ServiceError("No podés evaluarte a vos mismo", 400);
    }

    // Verificar que la reserva existe y que el evaluador participó
    const reserva = await db.reserva.findUnique({
      where: { id_reserva },
      include: { lobby: { include: { jugadores: true } } },
    });

    if (!reserva) {
      throw new ServiceError("Reserva no encontrada", 404);
    }

    // Verificar que el evaluado participó en la reserva
    const jugadores = reserva.lobby?.jugadores ?? [];
    const participoEvaluado = jugadores.some((lj) => lj.id_jugador === id_evaluado);
    if (!participoEvaluado) {
      throw new ServiceError("El jugador evaluado no participó en esta reserva", 400);
    }

    try {
      return await evaluacionRepository.crearEvaluacionJugador({
        id_evaluador,
        id_evaluado,
        id_reserva,
        puntaje,
      });
    } catch (error) {
      if (isKnownPrismaError(error, "P2002")) {
        throw new ServiceError("Ya evaluaste a este jugador en esta reserva", 409);
      }
      throw error;
    }
  }

  async evaluarTurno(body: unknown, id_jugador: string) {
    const payload = ensureObject(body);

    const id_turno = parsePositiveInteger(payload.id_turno, "id_turno");
    const puntaje = parsePuntaje(payload.puntaje);

    // Verificar que el turno existe
    const turno = await db.turno.findUnique({
      where: { id_turno },
    });

    if (!turno) {
      throw new ServiceError("Turno no encontrado", 404);
    }

    if (turno.estado_turno !== "Finalizado") {
      throw new ServiceError("Solo podés evaluar turnos finalizados", 400);
    }

    try {
      return await evaluacionRepository.crearEvaluacionTurno({
        id_jugador,
        id_turno,
        puntaje,
      });
    } catch (error) {
      if (isKnownPrismaError(error, "P2002")) {
        throw new ServiceError("Ya evaluaste este turno", 409);
      }
      throw error;
    }
  }

  private parseIdEvaluado(value: unknown): string {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new ServiceError("id_evaluado es requerido", 400);
    }
    return value.trim();
  }
}

export const evaluacionService = new EvaluacionService();