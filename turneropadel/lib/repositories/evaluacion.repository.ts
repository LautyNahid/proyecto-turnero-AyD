import { Prisma } from "@prisma/client";
import type { EvaluacionJugador, EvaluacionTurno } from "@prisma/client";
import { db } from "@/lib/db";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type CreateEvaluacionJugadorData = {
  id_evaluador: string;
  id_evaluado: string;
  id_reserva: number;
  puntaje: number;
};

export type CreateEvaluacionTurnoData = {
  id_jugador: string;
  id_turno: number;
  puntaje: number;
};

export interface EvaluacionRepository {
  crearEvaluacionJugador(data: CreateEvaluacionJugadorData): Promise<EvaluacionJugador>;
  crearEvaluacionTurno(data: CreateEvaluacionTurnoData): Promise<EvaluacionTurno>;
  buscarEvaluacionJugador(id_evaluador: string, id_evaluado: string, id_reserva: number): Promise<EvaluacionJugador | null>;
  buscarEvaluacionTurno(id_jugador: string, id_turno: number): Promise<EvaluacionTurno | null>;
}

// ─── Implementación ──────────────────────────────────────────────────────────

export class PrismaEvaluacionRepository implements EvaluacionRepository {
  crearEvaluacionJugador(data: CreateEvaluacionJugadorData) {
    return db.evaluacionJugador.create({ data });
  }

  crearEvaluacionTurno(data: CreateEvaluacionTurnoData) {
    return db.evaluacionTurno.create({ data });
  }

  buscarEvaluacionJugador(id_evaluador: string, id_evaluado: string, id_reserva: number) {
    return db.evaluacionJugador.findUnique({
      where: {
        id_evaluador_id_evaluado_id_reserva: {
          id_evaluador,
          id_evaluado,
          id_reserva,
        },
      },
    });
  }

  buscarEvaluacionTurno(id_jugador: string, id_turno: number) {
    return db.evaluacionTurno.findUnique({
      where: {
        id_jugador_id_turno: {
          id_jugador,
          id_turno,
        },
      },
    });
  }
}

export function isKnownPrismaError(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export const evaluacionRepository = new PrismaEvaluacionRepository();