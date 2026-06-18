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

export type TurnoFilters = {
  fechaDesde?: Date;
  fechaHasta?: Date;
  estados?: EstadoTurno[];
};

export interface TurnoRepository {
  findAll(): Promise<Turno[]>;
  findMany(filters: TurnoFilters): Promise<Turno[]>;
  findById(id_turno: number): Promise<Turno | null>;
  findBySchedule(key: TurnoScheduleKey): Promise<Turno | null>;
  create(data: CreateTurnoData): Promise<Turno>;
  update(id_turno: number, data: UpdateTurnoData): Promise<Turno>;
  delete(id_turno: number): Promise<Turno>;
  updatePrecioDisponibles(id_cancha: number, precio: number, hoy: Date): Promise<number>;
}

export class PrismaTurnoRepository implements TurnoRepository {
  findAll() {
    return db.turno.findMany({
      orderBy: [{ fecha: "asc" }, { hora: "asc" }],
    });
  }

  findMany(filters: TurnoFilters) {
    return db.turno.findMany({
      where: {
        ...(filters.fechaDesde || filters.fechaHasta
          ? {
              fecha: {
                ...(filters.fechaDesde ? { gte: filters.fechaDesde } : {}),
                ...(filters.fechaHasta ? { lte: filters.fechaHasta } : {}),
              },
            }
          : {}),
        ...(filters.estados ? { estado_turno: { in: filters.estados } } : {}),
      },
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

  async updatePrecioDisponibles(id_cancha: number, precio: number, hoy: Date): Promise<number> {
  const result = await db.turno.updateMany({
    where: {
      id_cancha,
      estado_turno: "Disponible",
      fecha: { gte: hoy },
    },
    data: { precio },
  });
  return result.count;
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
