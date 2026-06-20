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

export type TurnoConBloqueo = Turno & {
  bloqueos: { id_bloqueo: number; motivo: string; bloqueado_en: Date }[];
  cancha: { nro_cancha: number };
};

export type TurnoFinalizacionCandidate = Pick<Turno, "id_turno" | "fecha" | "hora">;

export interface TurnoRepository {
  findAll(): Promise<Turno[]>;
  findMany(filters: TurnoFilters): Promise<Turno[]>;
  findById(id_turno: number): Promise<Turno | null>;
  findBySchedule(key: TurnoScheduleKey): Promise<Turno | null>;
  create(data: CreateTurnoData): Promise<Turno>;
  update(id_turno: number, data: UpdateTurnoData): Promise<Turno>;
  delete(id_turno: number): Promise<Turno>;
  updatePrecioDisponibles(id_cancha: number, precio: number, hoy: Date): Promise<number>;
  findReservaByTurno(id_turno: number): Promise<{ id_reserva: number } | null>;
  findManyConBloqueos(filters: TurnoFilters): Promise<TurnoConBloqueo[]>;
  findFinalizacionCandidates(estados: EstadoTurno[], fechaHasta: Date): Promise<TurnoFinalizacionCandidate[]>;
  updateManyEstado(ids: number[], estado: EstadoTurno): Promise<number>;
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

  findManyConBloqueos(filters: TurnoFilters): Promise<TurnoConBloqueo[]> {
  const fechaWhere =
    filters.fechaDesde || filters.fechaHasta
      ? {
          fecha: {
            ...(filters.fechaDesde ? { gte: filters.fechaDesde } : {}),
            ...(filters.fechaHasta ? { lte: filters.fechaHasta } : {}),
          },
        }
      : {};

  const estadoOBloqueo = filters.estados
    ? {
        OR: [
          { estado_turno: { in: filters.estados } },
          { bloqueos: { some: {} } },
        ],
      }
    : {};

  return db.turno.findMany({
    where: {
      ...fechaWhere,
      ...estadoOBloqueo,
    },
    include: {
      bloqueos: { select: { id_bloqueo: true, motivo: true, bloqueado_en: true } },
      cancha: { select: { nro_cancha: true } },
    },
    orderBy: [{ fecha: "asc" }, { hora: "asc" }],
  }) as Promise<TurnoConBloqueo[]>;
}

  findFinalizacionCandidates(estados: EstadoTurno[], fechaHasta: Date) {
    return db.turno.findMany({
      where: {
        estado_turno: { in: estados },
        fecha: { lte: fechaHasta },
      },
      select: {
        id_turno: true,
        fecha: true,
        hora: true,
      },
    });
  }

  async updateManyEstado(ids: number[], estado: EstadoTurno) {
    if (ids.length === 0) return 0;

    const result = await db.turno.updateMany({
      where: {
        id_turno: { in: ids },
      },
      data: {
        estado_turno: estado,
      },
    });

    return result.count;
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

  findReservaByTurno(id_turno: number) {
  return db.reserva.findUnique({
    where: { id_turno },
    select: { id_reserva: true },
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
