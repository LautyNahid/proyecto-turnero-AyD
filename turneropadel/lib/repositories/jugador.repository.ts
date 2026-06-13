import type { Jugador } from "@prisma/client";
import { db } from "@/lib/db";

export interface JugadorRepository {
  findById(id_usuario: string): Promise<Jugador | null>;
}

export class PrismaJugadorRepository implements JugadorRepository {
  findById(id_usuario: string) {
    return db.jugador.findUnique({
      where: { id_usuario },
    });
  }
}

export const jugadorRepository = new PrismaJugadorRepository();
