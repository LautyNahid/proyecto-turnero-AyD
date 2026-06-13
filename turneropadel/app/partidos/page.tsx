"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MisPartidosList } from "@/components/partidos/MisPartidosList";
import { LobbyDetail } from "@/components/partidos/LobbyDetail";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLobby } from "@/hooks/useLobby";
import type { LobbyConRelaciones } from "@/lib/repositories/lobby.repository";
import type { Partido, PartidoLobby } from "@/lib/types";
import { PanelSkeleton } from "@/components/partidos/PanelSkeleton";

// ─── Mapper DB → Partido UI ───────────────────────────────────────────────────

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
    fecha: new Date(lobby.turno.fecha).toLocaleDateString("es-AR", {
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MisPartidosPage() {
  const isMobile = useIsMobile();
  const [lobbies, setLobbies] = useState<LobbyConRelaciones[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
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

  // Carga inicial de lobbies del usuario
  useEffect(() => {
    async function fetchLobbies() {
      try {
        const res = await fetch("/api/lobby");
        const json = await res.json();
        if (!res.ok) {
          setFetchError(json.error ?? "Error al cargar partidos");
          return;
        }
        const data = json.data as LobbyConRelaciones[];
        setLobbies(data);
        if (data.length > 0) {
          setSelectedId(data[0].id_lobby);
        }
      } catch {
        setFetchError("Error de red");
      }
    }

    fetchLobbies();
  }, []);

  // Carga detalle cuando cambia el seleccionado
  useEffect(() => {
    if (selectedId) cargarLobby(selectedId);
  }, [selectedId, cargarLobby]);

  function handleSelect(id: number) {
    setSelectedId(id);
    if (isMobile) setSheetOpen(true);
  }

  const partidos: Partido[] = lobbies.map(toLobbyPartido);

  const detailPanel = (() => {
    if (estado === "loading") return <PanelSkeleton />;
    if (lobbyError) {
      return (
        <div className="flex-1 flex items-center justify-center text-destructive text-sm">
          {lobbyError}
        </div>
      );
    }
    if (!lobbyDetalle) {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Seleccioná un partido para ver los detalles.
        </div>
      );
    }

    return (
      <LobbyDetail
        lobby={lobbyDetalle}
        onAceptarSolicitud={aceptarSolicitud}
        onRechazarSolicitud={rechazarSolicitud}
        onExpulsarJugador={expulsarJugador}
      />
    );
  })();

  if (fetchError) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full text-destructive text-sm">
          {fetchError}
        </div>
      </AppShell>
    );
  }

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
                {lobbyDetalle
                  ? `${new Date(lobbyDetalle.turno.fecha).toLocaleDateString("es-AR")} · ${lobbyDetalle.turno.hora}`
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