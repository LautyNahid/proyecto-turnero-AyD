import { escuchar } from "@/lib/events";
import { notificacionRepository } from "@/lib/repositories/notificacion.repository";
import { reservaRepository } from "@/lib/repositories/reserva.repository";
import { TipoNotificacion } from "@prisma/client";
import { NotificacionMailService } from "@/lib/services/notificacionMail.service";
import { usuarioRepository } from "@/lib/repositories/usuario.repository";
import { jugadorRepository } from "../repositories/jugador.repository";

const globalForNotificacionHandlers = globalThis as unknown as {
  notificacionHandlersInitialized?: boolean;
};

function combinarFechaYHora(fecha: Date, hora: string): string {
  const fechaString = fecha.toISOString().split("T")[0];
  const [year, month, day] = fechaString.split("-");
  return `${day}/${month}/${year} a las ${hora}`;
}

export function registrarHandlersNotificacion() {
  if (globalForNotificacionHandlers.notificacionHandlersInitialized) return;
  globalForNotificacionHandlers.notificacionHandlersInitialized = true;

  // LOBBY CONFIRMADO
  escuchar("lobby.confirmado", async ({ id_reserva }) => {
    try {
      const lobby = await reservaRepository.findLobbyByReservaId(id_reserva);
      if (!lobby || !lobby.turno) {
        throw new Error("datos incompletos");
      }
      await notificacionRepository.crearVarias(
        lobby.jugadores.map((lj) => ({
          id_destinatario: lj.id_jugador,
          tipo: TipoNotificacion.LobbyConfirmado,
        })),
      );

      //llamada a servicio de notificacion mail
      const fechaYHora = combinarFechaYHora(
        lobby.turno.fecha,
        lobby.turno.hora,
      );
      for (const integrante of lobby.jugadores) {
        await NotificacionMailService.notificarLobbyConfirmado(
          integrante.jugador.usuario.correo_electronico,
          {
            nombreJugador: integrante.jugador.usuario.nombre,
            fechaReserva: fechaYHora,
            nombreCancha: lobby.turno.cancha.nro_cancha,
          },
        );
      }
    } catch (error) {
      console.error("[handler] lobby.confirmado error:", error);
    }
  });

  // LOBBY CANCELADO
  escuchar("lobby.cancelado", async ({ id_reserva }) => {
    try {
      const lobby = await reservaRepository.findLobbyByReservaId(id_reserva);
      if (!lobby || !lobby.turno) {
        throw new Error("datos incompletos");
      }
      await notificacionRepository.crearVarias(
        lobby.jugadores.map((lj) => ({
          id_destinatario: lj.id_jugador,
          tipo: TipoNotificacion.CancelacionLobby,
        })),
      );
      const fechaYHora = combinarFechaYHora(
        lobby.turno.fecha,
        lobby.turno.hora,
      );
      //llamada a servicio de notificacion mail
      for (const integrante of lobby.jugadores) {
        await NotificacionMailService.notificarLobbyCancelado(
          integrante.jugador.usuario.correo_electronico,
          {
            nombreJugador: integrante.jugador.usuario.nombre,
            fechaReserva: fechaYHora,
            nombreCancha: lobby.turno.cancha.nro_cancha,
          },
        );
      }
    } catch (error) {
      console.error("[handler] lobby.cancelado error:", error);
    }
  });

  //SOLICITUD ACEPTADA
  escuchar("solicitud.aceptada", async ({ id_reserva, id_jugador }) => {
    try {
      await notificacionRepository.crear({
        id_destinatario: id_jugador,
        tipo: TipoNotificacion.SolicitudAceptada,
      });

      //llamada a servicio de notificacion mail
      const reserva = await reservaRepository.findById(id_reserva);
      const jugador = await jugadorRepository.findByIdConUsuario(id_jugador);
      if (!reserva || !jugador) {
        throw new Error("datos incompletos");
      }
      const fechaYHora = combinarFechaYHora(
        reserva.turno.fecha,
        reserva.turno.hora,
      );
      await NotificacionMailService.notificarSolicitudAceptada(
        jugador.usuario.correo_electronico,
        {
          nombreJugador: jugador.usuario.nombre,
          fechaReserva: fechaYHora,
          nombreCancha: reserva.turno.cancha.nro_cancha,
        },
      );
    } catch (error) {
      console.error("[handler] solicitud.aceptada error:", error);
    }
  });

  // SOLICITUD RECHAZADA
  escuchar("solicitud.rechazada", async ({ id_reserva, id_jugador }) => {
    try {
      await notificacionRepository.crear({
        id_destinatario: id_jugador,
        tipo: TipoNotificacion.SolicitudRechazada,
      });

      //llamada a servicio de notificacion mail
      const reserva = await reservaRepository.findById(id_reserva);
      const jugador = await jugadorRepository.findByIdConUsuario(id_jugador);
      if (!reserva || !jugador) {
        throw new Error("datos incompletos");
      }
      const fechaYHora = combinarFechaYHora(
        reserva.turno.fecha,
        reserva.turno.hora,
      );
      await NotificacionMailService.notificarSolicitudRechazada(
        jugador.usuario.correo_electronico,
        {
          nombreJugador: jugador.usuario.nombre,
          fechaReserva: fechaYHora,
          nombreCancha: reserva.turno.cancha.nro_cancha,
        },
      );
    } catch (error) {
      console.error("[handler] solicitud.rechazada error:", error);
    }
  });

  // RESERVA CONFIRMADA
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

      const fechaYHora = combinarFechaYHora(
        reserva.turno.fecha,
        reserva.turno.hora,
      );

      await NotificacionMailService.notificarReservaConfirmada(
        reserva.jugador.usuario.correo_electronico,
        {
          nombreJugador: reserva.jugador.usuario.nombre,
          fechaReserva: fechaYHora,
          nombreCancha: reserva.turno.cancha.nro_cancha,
        },
      );
    } catch (error) {
      console.error("[handler] reserva.confirmada error:", error);
    }
  });

  //RESERVA CANCELADA
  escuchar("reserva.cancelada", async ({ id_reserva }) => {
    try {
      const reserva = await reservaRepository.findById(id_reserva);
      if (!reserva) {
        throw new Error("datos incompletos");
      }
      //crea notificacion en db
      const notificacion = await notificacionRepository.crear({
        id_destinatario: reserva.id_jugador,
        tipo: TipoNotificacion.ReservaCancelada,
      });

      //llamada a servicio de notificacion mail
      const fechaYHora = combinarFechaYHora(
        reserva.turno.fecha,
        reserva.turno.hora,
      );
      await NotificacionMailService.notificarReservaCancelada(
        reserva.jugador.usuario.correo_electronico,
        {
          nombreJugador: reserva.jugador.usuario.nombre,
          fechaReserva: fechaYHora,
          nombreCancha: reserva.turno.cancha.nro_cancha,
        },
      );
    } catch (error) {
      console.error("[handler] reserva.cancelada error:", error);
    }
  });

  //JUGADOR EXPULSADO
  escuchar("jugador.expulsado", async ({ id_reserva, id_jugador }) => {
    try {
      const reserva = await reservaRepository.findById(id_reserva);
      const usuario = await usuarioRepository.findById(id_jugador);
      if (!reserva || !usuario) {
        throw new Error("datos incompletos");
      }
      //crea notificacion en db
      await notificacionRepository.crear({
        id_destinatario: id_jugador,
        tipo: TipoNotificacion.JugadorExpulsado,
      });

      //llamada a servicio de notificacion mail
      const fechaYHora = combinarFechaYHora(
        reserva.turno.fecha,
        reserva.turno.hora,
      );
      await NotificacionMailService.notificarJugadorExpulsado(
        usuario.correo_electronico,
        {
          nombreJugador: usuario.nombre,
          fechaReserva: fechaYHora,
          nombreCancha: reserva.turno.cancha.nro_cancha,
        },
      );
    } catch (error) {
      console.error("[handler] jugador.expulsado error:", error);
    }
  });

  // RECORDATORIO TURNO
  escuchar("turno.recordatorio", async ({ id_reserva }) => {
    try {
      const lobby = await reservaRepository.findLobbyByReservaId(id_reserva);
      if (!lobby || !lobby.turno) {
        throw new Error("datos incompletos");
      }
      await notificacionRepository.crearVarias(
        lobby.jugadores.map((lj) => ({
          id_destinatario: lj.id_jugador,
          tipo: TipoNotificacion.RecordatorioTurno,
        })),
      );

      //llamada a servicio de notificacion mail
      const fechaYHora = combinarFechaYHora(
        lobby.turno.fecha,
        lobby.turno.hora,
      );
      for (const integrante of lobby.jugadores) {
        await NotificacionMailService.notificarRecordatorioTurno(
          integrante.jugador.usuario.correo_electronico,
          {
            nombreJugador: integrante.jugador.usuario.nombre,
            fechaReserva: fechaYHora,
            nombreCancha: lobby.turno.cancha.nro_cancha,
          },
        );
      }
    } catch (error) {
      console.error("[handler] turno.recordatorio error:", error);
    }
  });

  escuchar("turno.finalizado", async ({ id_reserva }) => {
    try {
      const lobby = await reservaRepository.findLobbyByReservaId(id_reserva);
      if (!lobby || !lobby.turno) {
        throw new Error("datos incompletos");
      }
      await notificacionRepository.crearVarias(
        lobby.jugadores.map((lj) => ({
          id_destinatario: lj.id_jugador,
          tipo: TipoNotificacion.TurnoFinalizado,
        })),
      );

      //llamada a servicio de notificacion mail
      const fechaYHora = combinarFechaYHora(
        lobby.turno.fecha,
        lobby.turno.hora,
      );
      for (const integrante of lobby.jugadores) {
        await NotificacionMailService.notificarTurnoFinalizado(
          integrante.jugador.usuario.correo_electronico,
          {
            nombreJugador: integrante.jugador.usuario.nombre,
            fechaReserva: fechaYHora,
            nombreCancha: lobby.turno.cancha.nro_cancha,
          },
        );
      }
    } catch (error) {
      console.error("[handler] turno.finalizado error:", error);
    }
  });
}
