import { useState, useCallback } from "react";
import type { LobbyConRelaciones } from "@/lib/repositories/lobby.repository";

// Types

type EstadoFetch = "idle" | "loading" | "error";

type UseLobbyReturn = {
  lobby: LobbyConRelaciones | null;
  estado: EstadoFetch;
  error: string | null;
  cargarLobby: (id: number) => Promise<void>;
  aceptarSolicitud: (id_solicitud: number) => Promise<void>;
  rechazarSolicitud: (id_solicitud: number) => Promise<void>;
  expulsarJugador: (id_jugador: string) => Promise<void>;
  cancelarLobby: () => Promise<void>;
};

//  Helpers

async function fetchJson<T>(url: string, options?: RequestInit): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, options);
    const json = await res.json();
    if (!res.ok) return { data: null, error: json.error ?? "Error inesperado" };
    return { data: json.data, error: null };
  } catch {
    return { data: null, error: "Error de red" };
  }
}

//  Hook 

export function useLobby(id_lobby: number): UseLobbyReturn {
  const [lobby, setLobby] = useState<LobbyConRelaciones | null>(null);
  const [estado, setEstado] = useState<EstadoFetch>("idle");
  const [error, setError] = useState<string | null>(null);

  const cargarLobby = useCallback(async (id: number) => {
    setEstado("loading");
    setError(null);

    const { data, error } = await fetchJson<LobbyConRelaciones>(`/api/lobby/${id}`);

    if (error) {
      setError(error);
      setEstado("error");
      return;
    }

    setLobby(data);
    setEstado("idle");
  }, []);

  const aceptarSolicitud = useCallback(async (id_solicitud: number) => {
    if (!lobby) return;

    const { error } = await fetchJson(`/api/lobby/${lobby.id_lobby}/solicitud/${id_solicitud}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "aceptar" }),
    });

    if (error) {
      setError(error);
      return;
    }

    await cargarLobby(lobby.id_lobby);
  }, [lobby, cargarLobby]);

  const rechazarSolicitud = useCallback(async (id_solicitud: number) => {
    if (!lobby) return;

    const { error } = await fetchJson(`/api/lobby/${lobby.id_lobby}/solicitud/${id_solicitud}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "rechazar" }),
    });

    if (error) {
      setError(error);
      return;
    }

    await cargarLobby(lobby.id_lobby);
  }, [lobby, cargarLobby]);

  const expulsarJugador = useCallback(async (id_jugador: string) => {
    if (!lobby) return;

    const { error } = await fetchJson(`/api/lobby/${lobby.id_lobby}/jugador`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_jugador }),
    });

    if (error) {
      setError(error);
      return;
    }

    await cargarLobby(lobby.id_lobby);
  }, [lobby, cargarLobby]);

  const cancelarLobby = useCallback(async () => {
    if (!lobby) return;

    const { error } = await fetchJson(`/api/lobby/${lobby.id_lobby}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado_lobby: "Cancelado" }),
    });

    if (error) {
      setError(error);
      return;
    }

    await cargarLobby(lobby.id_lobby);
  }, [lobby, cargarLobby]);

  return {
    lobby,
    estado,
    error,
    cargarLobby,
    aceptarSolicitud,
    rechazarSolicitud,
    expulsarJugador,
    cancelarLobby,
  };
}