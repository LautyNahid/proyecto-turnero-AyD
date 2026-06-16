import { escuchar } from "@/lib/events";
import { notificacionRepository } from "@/lib/repositories/notificacion.repository";
import { TipoNotificacion } from "@prisma/client";
import { db } from "@/lib/db";

export function registrarHandlersNotificacion() {

  escuchar("lobby.confirmado", async ({ id_lobby }) => {
    try {
      const jugadores = await db.lobbyJugador.findMany({
        where: { id_lobby },
        select: { id_jugador: true },
      });

      await notificacionRepository.crearVarias(
        jugadores.map((lj) => ({
          id_destinatario: lj.id_jugador,
          tipo: TipoNotificacion.LobbyConfirmado,
        }))
      );
    } catch (error) {
      console.error("[handler] lobby.confirmado error:", error);
    }
  });

  escuchar("solicitud.aceptada", async ({ id_jugador }) => {
    try {
      await notificacionRepository.crear({
        id_destinatario: id_jugador,
        tipo: TipoNotificacion.SolicitudAceptada,
      });
    } catch (error) {
      console.error("[handler] solicitud.aceptada error:", error);
    }
  });

  escuchar("solicitud.rechazada", async ({ id_jugador }) => {
    try {
      await notificacionRepository.crear({
        id_destinatario: id_jugador,
        tipo: TipoNotificacion.SolicitudRechazada,
      });
    } catch (error) {
      console.error("[handler] solicitud.rechazada error:", error);
    }
  });
}