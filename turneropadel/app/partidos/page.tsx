"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MisPartidosList } from "@/components/partidos/MisPartidosList";
import { LobbyDetail } from "@/components/partidos/LobbyDetail";
import { ReservaDetail } from "@/components/partidos/ReservaDetail";
import { PanelSkeleton } from "@/components/partidos/PanelSkeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLobby } from "@/hooks/useLobby";
import type { LobbyConRelaciones } from "@/lib/repositories/lobby.repository";
import { parseLocalDate } from "@/lib/utils";
import type { ReservaWithRelations } from "@/lib/repositories/reserva.repository";
import type { Partido, PartidoLobby, PartidoReserva } from "@/lib/types";

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toLobbyPartido(lobby: LobbyConRelaciones): PartidoLobby {
  const jugadoresConfirmados = lobby.jugadores.map((lj, i) => ({
    id: i + 1,
    name: `${lj.jugador.usuario.nombre} ${lj.jugador.usuario.apellido}`,
    initials: `${lj.jugador.usuario.nombre[0]}${lj.jugador.usuario.apellido[0]}`,
    level: `${lj.jugador.categoria}`,
    side: null,
    status: "confirmed" as const,
    host: lj.id_jugador === lobby.id_creador,
  }));

  const lugaresVacios = Array.from({ length: lobby.jugadores_faltantes }, (_, i) => ({
    id: -(i + 1),
    name: null,
    initials: "+",
    level: null,
    side: null,
    status: "empty" as const,
  }));

  return {
    id: lobby.id_lobby,
    tipo: "lobby",
    fecha: parseLocalDate(lobby.turno.fecha).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    hora: lobby.turno.hora,
    club: `Cancha ${lobby.turno.cancha.nro_cancha}`,
    cancha: `Cancha ${lobby.turno.cancha.nro_cancha}`,
    duracionMin: 90,
    estado: lobby.estado_lobby,
    jugadores: [...jugadoresConfirmados, ...lugaresVacios],
    solicitudes: [],
  };
}

function toReservaPartido(reserva: ReservaWithRelations): PartidoReserva {
  return {
    id: reserva.id_reserva,
    tipo: "reserva",
    fecha: parseLocalDate(reserva.turno.fecha).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    hora: reserva.turno.hora,
    club: `Cancha ${reserva.turno.cancha.nro_cancha}`,
    cancha: `Cancha ${reserva.turno.cancha.nro_cancha}`,
    duracionMin: 90,
    jugadoresConfirmados: 1,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MisPartidosPage() {
  const isMobile = useIsMobile();
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<"lobby" | "reserva" | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const {
    lobby: lobbyDetalle,
    estado,
    error: lobbyError,
    cargarLobby,
    aceptarSolicitud,
    rechazarSolicitud,
    expulsarJugador,
  } = useLobby(selectedId ?? 0);

  useEffect(() => {
    async function fetchPartidos() {
      setLoading(true);
      try {
        const [resLobbies, resReservas] = await Promise.all([
          fetch("/api/lobby"),
          fetch("/api/reserva?jugador=me"),
        ]);

        const lobbiesJson = resLobbies.ok ? await resLobbies.json() : { data: [] };
        const reservasJson = resReservas.ok ? await resReservas.json() : [];

        const lobbies = (lobbiesJson.data as LobbyConRelaciones[]).map(toLobbyPartido);
        const reservas = (Array.isArray(reservasJson) ? reservasJson as ReservaWithRelations[] : []).map(toReservaPartido);
        console.log(lobbies);

        const todos: Partido[] = [...lobbies, ...reservas];

        setPartidos(todos);
        if (todos.length > 0) {
          setSelectedId(todos[0].id);
          setSelectedTipo(todos[0].tipo);
        }
      } catch {
        setFetchError("Error de red");
      } finally {
        setLoading(false);
      }
    }

    fetchPartidos();
  }, []);

  useEffect(() => {
    if (selectedId && selectedTipo === "lobby") cargarLobby(selectedId);
  }, [selectedId, selectedTipo, cargarLobby]);

  function handleSelect(id: number) {
    const partido = partidos.find((p) => p.id === id);
    if (!partido) return;
    setSelectedId(id);
    setSelectedTipo(partido.tipo);
    if (isMobile) setSheetOpen(true);
  }

  const selectedPartido = partidos.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedTipo !== "lobby" || !lobbyDetalle) return;

    setPartidos((current) =>
      current.map((partido) =>
        partido.tipo === "lobby" && partido.id === lobbyDetalle.id_lobby
          ? toLobbyPartido(lobbyDetalle)
          : partido
      )
    );
  }, [lobbyDetalle, selectedTipo]);

  const detailPanel = (() => {
    if (loading || estado === "loading") return <PanelSkeleton />;

    if (fetchError) {
      return (
        <div className="flex-1 flex items-center justify-center text-destructive text-sm">
          {fetchError}
        </div>
      );
    }

    if (!selectedPartido) {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Seleccioná un partido para ver los detalles.
        </div>
      );
    }

    if (selectedPartido.tipo === "reserva") {
      return <ReservaDetail reserva={selectedPartido} />;
    }

    if (lobbyError) {
      return (
        <div className="flex-1 flex items-center justify-center text-destructive text-sm">
          {lobbyError}
        </div>
      );
    }

    if (!lobbyDetalle) return <PanelSkeleton />;

    return (
      <LobbyDetail
        lobby={lobbyDetalle}
        onAceptarSolicitud={aceptarSolicitud}
        onRechazarSolicitud={rechazarSolicitud}
        onExpulsarJugador={expulsarJugador}
      />
    );
  })();

  return (
    <AppShell>
      <div className="flex -m-6 lg:-m-8 h-[calc(100vh-4rem)]">
        {/* Panel izquierdo */}
        <div className="w-72 lg:w-80 shrink-0 border-r border-border flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <MisPartidosList
              partidos={partidos}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </div>
        </div>

        {/* Panel derecho — desktop */}
        {!isMobile && (
          <div className="flex-1 overflow-y-auto p-8">
            {detailPanel}
          </div>
        )}
      </div>

      {/* Panel derecho — mobile */}
      {isMobile && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader className="mb-4">
              <SheetTitle>
                {selectedPartido
                  ? `${selectedPartido.fecha} · ${selectedPartido.hora}`
                  : "Detalle"}
              </SheetTitle>
            </SheetHeader>
            {detailPanel}
          </SheetContent>
        </Sheet>
      )}
    </AppShell>
  );
}