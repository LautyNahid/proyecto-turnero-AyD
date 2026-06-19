import { Prisma } from "@prisma/client";
import type { Reserva } from "@prisma/client";
import { db } from "@/lib/db";

export type ReservaWithRelations = Prisma.ReservaGetPayload<{
  include: {
    jugador: {
      include: {
        usuario: true;
      };
    };
    turno: {
      include: {
        cancha: true;
      };
    };
    lobby: true;
  };
}>;

export type CreateReservaData = {
  id_jugador: string;
  id_turno: number;
  precio?: number;
};

export type CreateReservaWithTurnoData = {
  id_jugador: string;
  id_cancha: number;
  fecha: Date;
  hora: string;
  precio: number;
};

const reservaInclude = {
  jugador: {
    include: {
      usuario: true,
    },
  },
  turno: {
    include: {
      cancha: true,
    },
  },
  lobby: true,
} satisfies Prisma.ReservaInclude;

const lobbyInclude = {
  turno: {
    include: {
      cancha: true,
    },
  },
  jugadores: {
    include: {
      jugador: {
        include: {
          usuario: true,
        },
      },
    },
  },
} satisfies Prisma.LobbyInclude;

export type LobbyConJugadores = Prisma.LobbyGetPayload<{
  include: typeof lobbyInclude;
}>;

export interface ReservaRepository {
  findAll(): Promise<ReservaWithRelations[]>;
  findById(id_reserva: number): Promise<ReservaWithRelations | null>;
  findByTurnoId(id_turno: number): Promise<Reserva | null>;
  findByJugadorId(id_jugador: string): Promise<ReservaWithRelations[]>;
  create(data: CreateReservaData): Promise<ReservaWithRelations>;
  createWithTurno(
    data: CreateReservaWithTurnoData,
  ): Promise<ReservaWithRelations>;
  delete(id_reserva: number): Promise<ReservaWithRelations>;
  findLobbyByReservaId(id_reserva: number): Promise<LobbyConJugadores | null>;
}

export class PrismaReservaRepository implements ReservaRepository {
  findAll() {
    return db.reserva.findMany({
      include: reservaInclude,
      orderBy: { creada_en: "desc" },
    });
  }

  findById(id_reserva: number) {
    return db.reserva.findUnique({
      where: { id_reserva },
      include: reservaInclude,
    });
  }

  findByTurnoId(id_turno: number) {
    return db.reserva.findUnique({
      where: { id_turno },
    });
  }

  findByJugadorId(id_jugador: string) {
    return db.reserva.findMany({
      where: { id_jugador },
      include: reservaInclude,
      orderBy: { creada_en: "desc" },
    });
  }

  create(data: CreateReservaData) {
  return db.$transaction(async (tx) => {
    const reserva = await tx.reserva.create({
      data: { id_jugador: data.id_jugador, id_turno: data.id_turno },
      include: reservaInclude,
    });

    await tx.turno.update({
      where: { id_turno: data.id_turno },
      data: {
        estado_turno: "Reservado",
        ...(data.precio !== undefined ? { precio: data.precio } : {}),
      },
    });

    return reserva;
  });
}

  createWithTurno(data: CreateReservaWithTurnoData) {
    return db.$transaction(async (tx) => {
      const turno = await tx.turno.create({
        data: {
          id_cancha: data.id_cancha,
          fecha: data.fecha,
          hora: data.hora,
          precio: data.precio,
          estado_turno: "Reservado",
        },
      });

      return tx.reserva.create({
        data: {
          id_jugador: data.id_jugador,
          id_turno: turno.id_turno,
        },
        include: reservaInclude,
      });
    });
  }

  delete(id_reserva: number) {
    return db.$transaction(async (tx) => {
      const reserva = await tx.reserva.delete({
        where: { id_reserva },
        include: reservaInclude,
      });

      await tx.turno.update({
        where: { id_turno: reserva.id_turno },
        data: { estado_turno: "Disponible" },
      });

      return reserva;
    });
  }

  findLobbyByReservaId(id_reserva: number) {
    return db.lobby.findUnique({
      where: { id_reserva },
      include: lobbyInclude,
    });
  }
}

export function isKnownPrismaError(error: unknown, code: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

export const reservaRepository = new PrismaReservaRepository();
