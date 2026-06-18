//dominio  api helpers clerk
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
};

export type Rol = "jugador" | "empleado" | "admin";

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> {
  return { data, error: null, ...(meta ? { meta } : {}) };
}

export function fail(error: string): ApiResponse<null> {
  return { data: null, error };
}

//dominio de partidos UI

export type EstadoLobby = "Abierto" | "Confirmado" | "Finalizado" | "Cancelado";
export type EstadoSolicitud =
  | "Pendiente"
  | "Aceptada"
  | "Rechazada"
  | "Cancelada";
export type EstadoJugadorSlot = "confirmed" | "pending" | "empty";

export interface JugadorSlot {
  id: number | string;
  name: string | null;
  initials: string;
  level: string | null;
  side: string | null;
  status: EstadoJugadorSlot;
  host?: boolean;
}

export interface Solicitud {
  id: number;
  name: string;
  initials: string;
  level: string;
  side: string;
}

export interface PartidoBase {
  id: number;
  fecha: string;
  hora: string;
  club: string;
  cancha: string;
  duracionMin: number;
}

export interface PartidoReserva extends PartidoBase {
  tipo: "reserva";
  jugadoresConfirmados: number;
}

export interface PartidoLobby extends PartidoBase {
  tipo: "lobby";
  estado: EstadoLobby;
  jugadores: JugadorSlot[];
  solicitudes: Solicitud[];
  clima?: string;
}

export type Partido = PartidoReserva | PartidoLobby;

//tipos para templates de mails
export interface DatosReservaMail {
  nombreJugador: string;
  fechaReserva: string; // o string si lo formateás antes
  nombreCancha: number;
}
