import { evaluacionRepository, isKnownPrismaError } from "@/lib/repositories/evaluacion.repository";
import { ServiceError } from "@/lib/services/service-error";
import { db } from "@/lib/db";
import { reservaRepository } from "@/lib/repositories/reserva.repository";

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

function parseIdFromParam(value: string, field: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ServiceError(`${field} debe ser un entero positivo`, 400);
  }
  return parsed;
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

  async obtenerEstadoEvaluacion(idReservaParam: string, id_usuario: string) {
    const id_reserva = parseIdFromParam(idReservaParam, "id_reserva");

    const reserva = await db.reserva.findUnique({
      where: { id_reserva },
      include: { turno: true, lobby: true },
    });

    if (!reserva) {
      throw new ServiceError("Reserva no encontrada", 404);
    }

    if (reserva.turno.estado_turno !== "Finalizado") {
      throw new ServiceError("El turno todavía no finalizó", 400);
    }

    const esLobby = reserva.lobby !== null;
    type CompanieroEstado = { id_usuario: string; nombre: string; evaluado: boolean; puntaje: number | null };
    let companeros: CompanieroEstado[] = [];

    if (esLobby) {
      const lobby = await reservaRepository.findLobbyByReservaId(id_reserva);
      if (!lobby) {
        throw new ServiceError("Lobby no encontrado", 404);
      }

      const participa = lobby.jugadores.some((lj) => lj.id_jugador === id_usuario);
      if (reserva.id_jugador !== id_usuario && !participa) {
        throw new ServiceError("No participaste de esta reserva", 403);
      }

      companeros = await Promise.all(
        lobby.jugadores
          .filter((lj) => lj.id_jugador !== id_usuario)
          .map(async (lj) => {
            const evaluacion = await evaluacionRepository.buscarEvaluacionJugador(id_usuario, lj.id_jugador, id_reserva);
            return {
              id_usuario: lj.id_jugador,
              nombre: `${lj.jugador.usuario.nombre} ${lj.jugador.usuario.apellido}`.trim(),
              evaluado: evaluacion !== null,
              puntaje: evaluacion?.puntaje ?? null,
            };
          }),
      );
    } else if (reserva.id_jugador !== id_usuario) {
      throw new ServiceError("No participaste de esta reserva", 403);
    }

    const evaluacionTurno = await evaluacionRepository.buscarEvaluacionTurno(id_usuario, reserva.id_turno);

    return {
      tipo: esLobby ? "lobby" : "directa",
      companeros,
      turno: {
        evaluado: evaluacionTurno !== null,
        puntaje: evaluacionTurno?.puntaje ?? null,
      },
    };
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