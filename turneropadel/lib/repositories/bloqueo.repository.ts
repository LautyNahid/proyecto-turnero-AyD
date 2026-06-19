import type { BloqueoHorario } from "@prisma/client";
import { db } from "@/lib/db";

export type CreateBloqueoData = {
  id_turno: number;
  motivo: string;
};

export interface BloqueoRepository {
  findByTurno(id_turno: number): Promise<BloqueoHorario | null>;
  create(data: CreateBloqueoData): Promise<BloqueoHorario>;
  deleteById(id_bloqueo: number): Promise<BloqueoHorario>;
}

export class PrismaBloqueoRepository implements BloqueoRepository {
  findByTurno(id_turno: number) {
    return db.bloqueoHorario.findFirst({
      where: { id_turno },
    });
  }

  create(data: CreateBloqueoData) {
    return db.bloqueoHorario.create({ data });
  }

  deleteById(id_bloqueo: number) {
    return db.bloqueoHorario.delete({
      where: { id_bloqueo },
    });
  }
}

export const bloqueoRepository = new PrismaBloqueoRepository();