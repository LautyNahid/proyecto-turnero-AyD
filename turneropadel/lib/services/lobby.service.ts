import { db } from "@/lib/db";
import { ok, fail } from "@/lib/types";
import type { ApiResponse } from "@/lib/types";
import type { Lobby, Solicitud } from "@prisma/client";
import type { EstadoLobby } from "@prisma/client";
import type { LobbyConRelaciones } from "@/lib/repositories/lobby.repository";
import * as repo from "@/lib/repositories/lobby.repository";
import { confirmarLobby } from "@/lib/services/lobby-reserva.service";
import { emitir } from "@/lib/events";
import { fromZonedTime } from "date-fns-tz";

//Types

const TIMEZONE = "America/Argentina/Buenos_Aires";

type CrearLobbyInput = {
  id_creador: string;
  jugadores_faltantes: number;
  id_turno?: number;
  id_cancha?: number;
  fecha?: string;
  hora?: string;
  precio?: number;
};

type ActualizarEstadoInput = {
  id_lobby: number;
  estado_lobby: EstadoLobby;
  id_solicitante: string;
};

type ResponderSolicitudInput = {
  id_solicitud: number;
  id_lobby: number;
  accion: "aceptar" | "rechazar";
  id_organizador: string;
};

type ExpulsarJugadorInput = {
  id_lobby: number;
  id_jugador: string;
  id_organizador: string;
};

type ResponderSolicitudResult = {
  solicitud: Solicitud;
  lobby_confirmado: boolean;
};

// Guards de dominio 

function assertLobbyExiste(
  lobby: Awaited<ReturnType<typeof repo.findLobbyParaValidacion>>
): asserts lobby is NonNullable<typeof lobby> {
  if (!lobby) throw new Error("Lobby no encontrado");
}

function assertEsOrganizador(id_creador: string, id_solicitante: string) {
  if (id_creador !== id_solicitante) throw new Error("Sin permisos");
}

function assertLobbyAbierto(estado: EstadoLobby) {
  if (estado !== "Abierto") throw new Error("El lobby ya no está abierto");
}

function assertHayCupos(faltantes: number) {
  if (faltantes <= 0) throw new Error("El partido ya está completo");
}

//  Service 

export async function listarLobbies(
  soloAbiertos = true
): Promise<ApiResponse<LobbyConRelaciones[] | null >> {
  try {
    return ok(await repo.findLobbies(db, soloAbiertos));
  } catch {
    return fail("Error al obtener lobbies");
  }
}

export async function obtenerLobby(
  id_lobby: number
): Promise<ApiResponse<LobbyConRelaciones | null>> {
  try {
    const lobby = await repo.findLobbyById(db, id_lobby);
    if (!lobby) return fail("Lobby no encontrado");
    return ok(lobby);
  } catch {
    return fail("Error al obtener el lobby");
  }
}

export async function crearLobby(
  input: CrearLobbyInput
): Promise<ApiResponse<Lobby | null>> {
  const { id_turno, id_creador, jugadores_faltantes, id_cancha, fecha, hora, precio } = input;

  if (jugadores_faltantes < 1 || jugadores_faltantes > 3) {
    return fail("jugadores_faltantes debe ser entre 1 y 3");
  }

  try {
    const lobby = await db.$transaction(async (tx) => {
      let targetTurnoId = id_turno;

      if (!targetTurnoId) {
        if (!id_cancha || !fecha || !hora) {
          throw new Error("Faltan datos para identificar o crear el turno");
        }

        const parsedFecha = fromZonedTime(`${fecha}T00:00:00`, TIMEZONE);
        if (Number.isNaN(parsedFecha.getTime())) throw new Error("Fecha inválida");

        const existing = await repo.findTurnoBySchedule(tx, {
          id_cancha,
          fecha: parsedFecha,
          hora,
        });

        if (existing) {
          targetTurnoId = existing.id_turno;
        } else {
          const nuevoTurno = await repo.createTurno(tx, {
            id_cancha,
            fecha: parsedFecha,
            hora,
            precio: precio ?? 12000,
          });
          targetTurnoId = nuevoTurno.id_turno;
        }
      }

      const turno = await repo.findTurnoParaLobby(tx, targetTurnoId!);
      if (!turno) throw new Error("Turno no encontrado");
      if (turno.estado_turno !== "Disponible")
        throw new Error("El turno no está disponible");
      if (turno.lobby) throw new Error("El turno ya tiene un lobby asociado");

      const nuevo = await repo.createLobby(tx, {
        id_turno: targetTurnoId!,
        id_creador,
        jugadores_faltantes,
      });
      await repo.createInscripcion(tx, nuevo.id_lobby, id_creador);
      await repo.lockTurnoParaLobby(tx, targetTurnoId!);

      return nuevo;
    });

    return ok(lobby);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Error al crear el lobby");
  }
}

export async function actualizarEstadoLobby(
  input: ActualizarEstadoInput
): Promise<ApiResponse<Lobby | null>> {
  const { id_lobby, estado_lobby, id_solicitante } = input;

  try {
    const lobby = await repo.findLobbyParaValidacion(db, id_lobby);
    assertLobbyExiste(lobby);
    assertEsOrganizador(lobby.id_creador, id_solicitante);

    const updated = await db.$transaction((tx) =>
      repo.updateEstadoLobby(tx, id_lobby, { estado_lobby })
    );

    return ok(updated);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Error al actualizar el estado del lobby");
  }
}

export async function listarSolicitudes(
  id_lobby: number,
  id_solicitante: string
): Promise<ApiResponse<Solicitud[] | null>> {
  try {
    const lobby = await repo.findLobbyParaValidacion(db, id_lobby);
    assertLobbyExiste(lobby);
    assertEsOrganizador(lobby.id_creador, id_solicitante);

    return ok(await repo.findSolicitudesByLobby(db, id_lobby));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Error al obtener solicitudes");
  }
}

export async function crearSolicitud(
  id_lobby: number,
  id_jugador: string
): Promise<ApiResponse<Solicitud | null>> {
  try {
    const solicitud = await db.$transaction(async (tx) => {
      const lobby = await repo.findLobbyParaValidacion(tx, id_lobby);
      assertLobbyExiste(lobby);
      assertLobbyAbierto(lobby.estado_lobby);
      assertHayCupos(lobby.jugadores_faltantes);

      if (lobby.id_creador === id_jugador)
        throw new Error("El organizador no puede solicitar ingreso a su propio lobby");

      const yaInscripto = await repo.findInscripcion(tx, id_lobby, id_jugador);
      if (yaInscripto) throw new Error("Ya estás inscripto en este lobby");

      const solicitudExistente = await repo.findSolicitudExistente(tx, id_jugador, id_lobby);
      if (solicitudExistente?.estado_solicitud === "Pendiente")
        throw new Error("Ya tenés una solicitud pendiente para este lobby");

      return repo.createSolicitud(tx, id_jugador, id_lobby);
    });

    return ok(solicitud);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Error al crear la solicitud");
  }
}

export async function responderSolicitud(
  input: ResponderSolicitudInput
): Promise<ApiResponse<ResponderSolicitudResult | null>> {
  const { id_solicitud, id_lobby, accion, id_organizador } = input;

  try {
    const resultado = await db.$transaction(async (tx) => {
      const lobby = await repo.findLobbyParaValidacion(tx, id_lobby);
      assertLobbyExiste(lobby);
      assertEsOrganizador(lobby.id_creador, id_organizador);
      assertLobbyAbierto(lobby.estado_lobby);

      const solicitud = await repo.findSolicitudById(tx, id_solicitud);
      if (!solicitud) throw new Error("Solicitud no encontrada");
      if (solicitud.id_lobby !== id_lobby)
        throw new Error("Solicitud no pertenece a este lobby");
      if (solicitud.estado_solicitud !== "Pendiente")
        throw new Error("La solicitud ya no se encuentra disponible");

      if (accion === "rechazar") {
        const actualizada = await repo.updateEstadoSolicitud(tx, id_solicitud, "Rechazada");
        return { solicitud: actualizada, faltantesRestantes: lobby.jugadores_faltantes, id_turno: lobby.id_turno };
      }

      assertHayCupos(lobby.jugadores_faltantes);

      const solicitudActualizada = await repo.updateEstadoSolicitud(tx, id_solicitud, "Aceptada");
      await repo.createInscripcion(tx, id_lobby, solicitud.id_jugador);

      const { actualizado, faltantesRestantes } = await repo.decrementarFaltantesAtomico(tx, id_lobby);

      if (!actualizado) {
        throw new Error("El partido ya está completo");
      }

      return { solicitud: solicitudActualizada, faltantesRestantes: faltantesRestantes!, id_turno: lobby.id_turno };
    });

    const lobbyCompleto = resultado.faltantesRestantes === 0;
    let lobby_confirmado = false;

    if (lobbyCompleto) {
      const confirmacion = await confirmarLobby({ id_lobby, id_turno: resultado.id_turno });
      if (confirmacion.ok) {
        emitir("lobby.confirmado", { id_lobby });
        lobby_confirmado = true;
      }
    }

    return ok({ solicitud: resultado.solicitud, lobby_confirmado });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Error al responder la solicitud");
  }
}

export async function expulsarJugador(
  input: ExpulsarJugadorInput
): Promise<ApiResponse<{ expulsado: boolean } | null>> {
  const { id_lobby, id_jugador, id_organizador } = input;

  try {
    await db.$transaction(async (tx) => {
      const lobby = await repo.findLobbyParaValidacion(tx, id_lobby);
      assertLobbyExiste(lobby);
      assertEsOrganizador(lobby.id_creador, id_organizador);
      
      assertLobbyAbierto(lobby.estado_lobby);

      if (lobby.id_creador === id_jugador)
        throw new Error("El organizador no puede expulsarse a sí mismo");

      const inscripcion = await repo.findInscripcion(tx, id_lobby, id_jugador);
      if (!inscripcion) throw new Error("El jugador no está en este lobby");

      await repo.deleteInscripcion(tx, id_lobby, id_jugador);
      await repo.incrementarFaltantes(tx, id_lobby);
      await repo.cancelarSolicitudAceptada(tx, id_lobby, id_jugador);
    });

    return ok({ expulsado: true });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Error al expulsar jugador");
  }
}

export async function listarLobbiesDelJugador(
  id_jugador: string
): Promise<ApiResponse<LobbyConRelaciones[] | null>> {
  try {
    return ok(await repo.findLobbiesByJugador(db, id_jugador));
  } catch {
    return fail("Error al obtener lobbies del jugador");
  }
}
