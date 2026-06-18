import { escuchar } from "@/lib/events";
import { notificacionRepository } from "@/lib/repositories/notificacion.repository";
import { reservaRepository } from "@/lib/repositories/reserva.repository";
import { TipoNotificacion } from "@prisma/client";
import { db } from "@/lib/db";
import { NotificacionMailService } from "@/lib/services/notificacionMail.service";

const globalForNotificacionHandlers = globalThis as unknown as {
  notificacionHandlersInitialized?: boolean;
};

export function registrarHandlersNotificacion() {
  if (globalForNotificacionHandlers.notificacionHandlersInitialized) return;
  globalForNotificacionHandlers.notificacionHandlersInitialized = true;

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
        })),
      );
    } catch (error) {
      console.error("[handler] lobby.confirmado error:", error);
    }
  });

  escuchar("solicitud.aceptada", async ({ id_jugador }) => {
    try {
      const notificacion = await notificacionRepository.crear({
        id_destinatario: id_jugador,
        tipo: TipoNotificacion.SolicitudAceptada,
      });
      //llamada a servicio de notificacion mail
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

  escuchar("reserva.confirmada", async ({ id_reserva }) => {
    try {
      const reserva = await reservaRepository.findById(id_reserva);
      if (!reserva) {
        throw new Error("datos incompletos");
      }
      //crea notificacion en db
      await notificacionRepository.crear({
        id_destinatario: reserva.id_jugador,
        tipo: TipoNotificacion.ReservaConfirmada,
      });

      //llamada a servicio de notificacion mail
      await NotificacionMailService.notificarReservaConfirmada(
        reserva.jugador.usuario.correo_electronico,
        {
          nombreJugador: reserva.jugador.usuario.nombre,
          fechaReserva: reserva.turno.fecha.toISOString(),
          nombreCancha: reserva.turno.cancha.nro_cancha,
        },
      );
    } catch (error) {
      console.error("[handler] solicitud.aceptada error:", error);
    }
  });

  escuchar("reserva.cancelada", async ({ id_reserva }) => {
    try {
      const reserva = await reservaRepository.findById(id_reserva);
      if (!reserva) {
        throw new Error("datos incompletos");
      }
      //crea notificacion en db
      const notificacion = await notificacionRepository.crear({
        id_destinatario: reserva.id_jugador,
        tipo: TipoNotificacion.ReservaConfirmada,
      });

      //llamada a servicio de notificacion mail
      await NotificacionMailService.notificarReservaCancelada(
        reserva.jugador.usuario.correo_electronico,
        {
          nombreJugador: reserva.jugador.usuario.nombre,
          fechaReserva: reserva.turno.fecha.toISOString(),
          nombreCancha: reserva.turno.cancha.nro_cancha,
        },
      );
    } catch (error) {
      console.error("[handler] solicitud.aceptada error:", error);
    }
  });
}
