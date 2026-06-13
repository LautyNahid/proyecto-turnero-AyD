import { Prisma } from "@prisma/client";
import type { EstadoTurno, Turno } from "@prisma/client";
import { db } from "@/lib/db";

export type CreateTurnoData = {
  id_cancha: number;
  fecha: Date;
  hora: string;
  precio: number;
  estado_turno?: EstadoTurno;
};

export type UpdateTurnoData = Partial<CreateTurnoData>;

export type TurnoScheduleKey = {
  id_cancha: number;
  fecha: Date;
  hora: string;
};

export interface TurnoRepository {
  findAll(): Promise<Turno[]>;
  findById(id_turno: number): Promise<Turno | null>;
  findBySchedule(key: TurnoScheduleKey): Promise<Turno | null>;
  create(data: CreateTurnoData): Promise<Turno>;
  update(id_turno: number, data: UpdateTurnoData): Promise<Turno>;
  delete(id_turno: number): Promise<Turno>;
}

export class PrismaTurnoRepository implements TurnoRepository {
  findAll() {
    return db.turno.findMany({
      orderBy: [{ fecha: "asc" }, { hora: "asc" }],
    });
  }

  findById(id_turno: number) {
    return db.turno.findUnique({
      where: { id_turno },
    });
  }

  findBySchedule({ id_cancha, fecha, hora }: TurnoScheduleKey) {
    return db.turno.findUnique({
      where: {
        id_cancha_fecha_hora: {
          id_cancha,
          fecha,
          hora,
        },
      },
    });
  }

  create(data: CreateTurnoData) {
    return db.turno.create({
      data,
    });
  }

  update(id_turno: number, data: UpdateTurnoData) {
    return db.turno.update({
      where: { id_turno },
      data,
    });
  }

  delete(id_turno: number) {
    return db.turno.delete({
      where: { id_turno },
    });
  }
}

export function isKnownPrismaError(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export const turnoRepository = new PrismaTurnoRepository();
