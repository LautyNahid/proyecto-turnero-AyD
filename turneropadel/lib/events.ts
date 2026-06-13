import { EventEmitter } from "events";

// Tipos de eventos 

type EventosApp = {
  "lobby.confirmado": { id_lobby: number };
  "solicitud.aceptada": { id_lobby: number; id_jugador: string };
  "solicitud.rechazada": { id_lobby: number; id_jugador: string };
};

type NombreEvento = keyof EventosApp;

// Emitter tipado

class AppEventEmitter extends EventEmitter {
  emitir<K extends NombreEvento>(evento: K, payload: EventosApp[K]): boolean {
    return this.emit(evento, payload);
  }

  escuchar<K extends NombreEvento>(
    evento: K,
    handler: (payload: EventosApp[K]) => void
  ): this {
    return this.on(evento, handler);
  }
}

const appEvents = new AppEventEmitter();
appEvents.setMaxListeners(20);

// Exports 

export const emitir = appEvents.emitir.bind(appEvents);
export const escuchar = appEvents.escuchar.bind(appEvents);
export type { EventosApp, NombreEvento };