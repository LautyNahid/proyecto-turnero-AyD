import type { Jugador, Usuario } from "@prisma/client";
import { db } from "@/lib/db";

export type JugadorConUsuario = Jugador & { usuario: Usuario };

export type UpdateJugadorData = {
  ciudad?: string;
  categoria?: number;
};

export interface JugadorRepository {
  findById(id_usuario: string): Promise<Jugador | null>;
  findByIdConUsuario(id_usuario: string): Promise<JugadorConUsuario | null>;
  update(id_usuario: string, data: UpdateJugadorData): Promise<Jugador>;
  incrementPenalizaciones(id_usuario: string): Promise<Jugador>;
}

export class PrismaJugadorRepository implements JugadorRepository {
  findById(id_usuario: string) {
    return db.jugador.findUnique({
      where: { id_usuario },
    });
  }

  findByIdConUsuario(id_usuario: string) {
    return db.jugador.findUnique({
      where: { id_usuario },
      include: { usuario: true },
    });
  }

  update(id_usuario: string, data: UpdateJugadorData) {
    return db.jugador.update({
      where: { id_usuario },
      data,
    });
  }

  incrementPenalizaciones(id_usuario: string) {
  return db.jugador.update({
    where: { id_usuario },
    data: { penalizaciones: { increment: 1 } },
  });
 }
}

export const jugadorRepository = new PrismaJugadorRepository();