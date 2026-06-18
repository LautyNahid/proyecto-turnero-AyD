import { db } from "@/lib/db";
import type { EstadoLobby, EstadoSolicitud, Lobby, Solicitud, Prisma } from "@prisma/client";

// Types 

type DbClient = Prisma.TransactionClient | typeof db;

export const lobbyInclude = {
  turno: {
    select: {
      id_turno: true,
      hora: true,
      fecha: true,
      precio: true,
      cancha: { select: { id_cancha: true, nro_cancha: true } },
    },
  },
  creador: {
    select: {
      id_usuario: true,
      categoria: true,
      usuario: { select: { nombre: true, apellido: true } },
    },
  },
  jugadores: {
    include: {
      jugador: {
        select: {
          id_usuario: true,
          categoria: true,
          usuario: { select: { nombre: true, apellido: true } },
        },
      },
    },
  },
  solicitudes: true,
} satisfies Prisma.LobbyInclude;

export type LobbyConRelaciones = Prisma.LobbyGetPayload<{
  include: typeof lobbyInclude;
}>;

// Lobby 

export async function findLobbies(
  client: DbClient,
  soloAbiertos: boolean
): Promise<LobbyConRelaciones[]> {
  return client.lobby.findMany({
    where: soloAbiertos
      ? { estado_lobby: "Abierto", jugadores_faltantes: { gt: 0 } }
      : undefined,
    include: lobbyInclude,
    orderBy: { turno: { fecha: "asc" } },
  });
}

export async function findLobbyById(
  client: DbClient,
  id_lobby: number
): Promise<LobbyConRelaciones | null> {
  return client.lobby.findUnique({
    where: { id_lobby },
    include: lobbyInclude,
  });
}

export async function findLobbyParaValidacion(
  client: DbClient,
  id_lobby: number
) {
  return client.lobby.findUnique({
    where: { id_lobby },
    select: {
      id_creador: true,
      estado_lobby: true,
      jugadores_faltantes: true,
      id_turno: true,
    },
  });
}

export async function findTurnoParaLobby(client: DbClient, id_turno: number) {
  return client.turno.findUnique({
    where: { id_turno },
    select: {
      estado_turno: true,
      lobby: { select: { id_lobby: true } },
    },
  });
}

export async function findTurnoBySchedule(
  client: DbClient,
  where: { id_cancha: number; fecha: Date; hora: string }
) {
  return client.turno.findFirst({
    where,
    select: {
      id_turno: true,
      estado_turno: true,
      lobby: { select: { id_lobby: true } },
    },
  });
}

export async function createTurno(
  client: DbClient,
  data: { id_cancha: number; fecha: Date; hora: string; precio: number }
) {
  return client.turno.create({
    data: {
      id_cancha: data.id_cancha,
      fecha: data.fecha,
      hora: data.hora,
      precio: data.precio,
      estado_turno: "Disponible",
    },
  });
}

export async function createLobby(
  client: DbClient,
  data: { id_turno: number; id_creador: string; jugadores_faltantes: number }
): Promise<Lobby> {
  return client.lobby.create({
    data: { ...data, estado_lobby: "Abierto" },
  });
}

export async function updateEstadoLobby(
  client: DbClient,
  id_lobby: number,
  data: { estado_lobby?: EstadoLobby; jugadores_faltantes?: number }
): Promise<Lobby> {
  return client.lobby.update({ where: { id_lobby }, data });
}

export async function decrementarFaltantesAtomico(
  client: DbClient,
  id_lobby: number
): Promise<{ actualizado: boolean; faltantesRestantes: number | null }> {
  const result = await client.lobby.updateMany({
    where: { id_lobby, jugadores_faltantes: { gt: 0 } },
    data: { jugadores_faltantes: { decrement: 1 } },
  });

  if (result.count === 0) {
    return { actualizado: false, faltantesRestantes: null };
  }

  const lobby = await client.lobby.findUnique({
    where: { id_lobby },
    select: { jugadores_faltantes: true },
  });

  return { actualizado: true, faltantesRestantes: lobby?.jugadores_faltantes ?? null };
}

export async function incrementarFaltantes(
  client: DbClient,
  id_lobby: number
): Promise<Lobby> {
  return client.lobby.update({
    where: { id_lobby },
    data: { jugadores_faltantes: { increment: 1 } },
  });
}

// LobbyJugador 

export async function findInscripcion(
  client: DbClient,
  id_lobby: number,
  id_jugador: string
) {
  return client.lobbyJugador.findUnique({
    where: { id_lobby_id_jugador: { id_lobby, id_jugador } },
  });
}

export async function createInscripcion(
  client: DbClient,
  id_lobby: number,
  id_jugador: string
) {
  return client.lobbyJugador.create({
    data: { id_lobby, id_jugador },
  });
}

export async function deleteInscripcion(
  client: DbClient,
  id_lobby: number,
  id_jugador: string
) {
  return client.lobbyJugador.delete({
    where: { id_lobby_id_jugador: { id_lobby, id_jugador } },
  });
}

// Solicitud

export async function findSolicitudesByLobby(
  client: DbClient,
  id_lobby: number
): Promise<Solicitud[]> {
  return client.solicitud.findMany({
    where: { id_lobby },
    orderBy: { creada_en: "asc" },
  });
}

export async function findSolicitudById(
  client: DbClient,
  id_solicitud: number
) {
  return client.solicitud.findUnique({
    where: { id_solicitud },
    select: { id_jugador: true, estado_solicitud: true, id_lobby: true },
  });
}

export async function findSolicitudExistente(
  client: DbClient,
  id_jugador: string,
  id_lobby: number
) {
  return client.solicitud.findUnique({
    where: { id_jugador_id_lobby: { id_jugador, id_lobby } },
    select: { estado_solicitud: true },
  });
}

export async function createSolicitud(
  client: DbClient,
  id_jugador: string,
  id_lobby: number
): Promise<Solicitud> {
  return client.solicitud.create({
    data: { id_jugador, id_lobby, estado_solicitud: "Pendiente" },
  });
}

export async function updateEstadoSolicitud(
  client: DbClient,
  id_solicitud: number,
  estado_solicitud: EstadoSolicitud
): Promise<Solicitud> {
  return client.solicitud.update({
    where: { id_solicitud },
    data: { estado_solicitud },
  });
}

export async function cancelarSolicitudAceptada(
  client: DbClient,
  id_lobby: number,
  id_jugador: string
) {
  return client.solicitud.updateMany({
    where: { id_lobby, id_jugador, estado_solicitud: "Aceptada" },
    data: { estado_solicitud: "Cancelada" },
  });
}

export async function findLobbiesByJugador(
  client: DbClient,
  id_jugador: string
): Promise<LobbyConRelaciones[]> {
  return client.lobby.findMany({
    where: {
      OR: [
        { id_creador: id_jugador },
        { jugadores: { some: { id_jugador } } },
      ],
    },
    include: lobbyInclude,
    orderBy: { turno: { fecha: "asc" } },
  });
}

export async function lockTurnoParaLobby(client: DbClient, id_turno: number) {
  return client.turno.update({
    where: { id_turno },
    data: { estado_turno: "Reservado" },
  });
}

export async function confirmarLobbyConReserva(
  client: DbClient,
  id_lobby: number,
  id_reserva: number
): Promise<Lobby> {
  return client.lobby.update({
    where: { id_lobby },
    data: { estado_lobby: "Confirmado", id_reserva },
  });
}