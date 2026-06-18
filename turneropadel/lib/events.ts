import { EventEmitter } from "events";

// Tipos de eventos

type EventosApp = {
  "lobby.confirmado": { id_reserva: number };
  "solicitud.aceptada": { id_lobby: number; id_jugador: string };
  "solicitud.rechazada": { id_lobby: number; id_jugador: string };
  "reserva.confirmada": { id_reserva: number };
  "reserva.cancelada": { id_reserva: number };

  "jugador.expulsado": { id_reserva: number; id_jugador: string };
  "lobby.cancelado": { id_reserva: number };
};

type NombreEvento = keyof EventosApp;

// Emitter tipado

class AppEventEmitter extends EventEmitter {
  emitir<K extends NombreEvento>(evento: K, payload: EventosApp[K]): boolean {
    return this.emit(evento, payload);
  }

  escuchar<K extends NombreEvento>(
    evento: K,
    handler: (payload: EventosApp[K]) => void,
  ): this {
    return this.on(evento, handler);
  }
}

const globalForEvents = globalThis as unknown as {
  appEvents?: AppEventEmitter;
};
const appEvents = globalForEvents.appEvents ?? new AppEventEmitter();
globalForEvents.appEvents = appEvents;

appEvents.setMaxListeners(20);

// Exports

export const emitir = appEvents.emitir.bind(appEvents);
export const escuchar = appEvents.escuchar.bind(appEvents);
export type { EventosApp, NombreEvento };
