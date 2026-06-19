export const EstadoNotificacion = {
  Pendiente: "Pendiente",
  Enviada: "Enviada",
  Fallida: "Fallida",
} as const;

export type EstadoNotificacion =
  (typeof EstadoNotificacion)[keyof typeof EstadoNotificacion];

export type TipoNotificacion =
  | "LobbyConfirmado"
  | "RecordatorioTurno"
  | "TurnoFinalizado"
  | "SolicitudRechazada"
  | "SolicitudAceptada"
  | "JugadorExpulsado"
  | "CancelacionLobby"
  | "ReservaConfirmada"
  | "ReservaCancelada";

export const TIPO_NOTIFICACION_LABELS: Record<TipoNotificacion, string> = {
  LobbyConfirmado: "Tu lobby fue confirmado",
  RecordatorioTurno: "Recordatorio de turno",
  TurnoFinalizado: "Turno finalizado",
  SolicitudRechazada: "Tu solicitud fue rechazada",
  SolicitudAceptada: "Tu solicitud fue aceptada",
  JugadorExpulsado: "Fuiste expulsado del lobby",
  CancelacionLobby: "Un lobby fue cancelado",
  ReservaConfirmada: "Reserva confirmada",
  ReservaCancelada: "Reserva cancelada",
};
