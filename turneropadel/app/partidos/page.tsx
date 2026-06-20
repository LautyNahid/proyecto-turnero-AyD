"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

  const tieneTurno = Boolean(lobby.turno);
  return {
    id: lobby.id_lobby,
    tipo: "lobby",
    fecha: tieneTurno
      ? parseLocalDate(lobby.turno!.fecha).toLocaleDateString("es-AR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "Sin turno",
    hora: lobby.turno?.hora ?? "—",
    club: tieneTurno ? `Cancha ${lobby.turno!.cancha.nro_cancha}` : "Turno no asignado",
    cancha: tieneTurno ? `Cancha ${lobby.turno!.cancha.nro_cancha}` : "Turno no asignado",
    duracionMin: 90,
    estado: lobby.estado_lobby,
    jugadores: [...jugadoresConfirmados, ...lugaresVacios],
    solicitudes: [],
  };
}

function toReservaPartido(reserva: ReservaWithRelations): PartidoReserva {
  const fechaClimaLocal = parseLocalDate(reserva.turno.fecha);
  const fechaClima = `${fechaClimaLocal.getFullYear()}-${String(fechaClimaLocal.getMonth() + 1).padStart(2, "0")}-${String(fechaClimaLocal.getDate()).padStart(2, "0")}`;

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
    fecha_clima: fechaClima,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function MisPartidosContent() {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const requestedIdParam = searchParams.get("id");
  const requestedTipoParam = searchParams.get("tipo");
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
    cancelarLobby,
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
        
        const lobbies = (lobbiesJson.data as LobbyConRelaciones[])
          .filter((lobby) => lobby.turno && lobby.turno.estado_turno !== "Finalizado")
          .map(toLobbyPartido);
        const reservas = (Array.isArray(reservasJson) ? reservasJson as ReservaWithRelations[] : [])
          .filter((reserva) => reserva.turno.estado_turno !== "Finalizado")
          .map(toReservaPartido);

        const todos: Partido[] = [...lobbies, ...reservas];

        const hasRequestedPartido = requestedIdParam !== null || requestedTipoParam !== null;
        const requestedId = Number(requestedIdParam);
        const requestedTipo = requestedTipoParam;
        const requestedPartido = todos.find(
          (partido) =>
            partido.id === requestedId &&
            (requestedTipo === "lobby" || requestedTipo === "reserva") &&
            partido.tipo === requestedTipo,
        );
        const initialPartido = requestedPartido ?? (hasRequestedPartido ? null : todos[0]);

        setPartidos(todos);
        if (initialPartido) {
          setSelectedId(initialPartido.id);
          setSelectedTipo(initialPartido.tipo);
        } else {
          setSelectedId(null);
          setSelectedTipo(null);
        }
      } catch {
        setFetchError("Error de red");
      } finally {
        setLoading(false);
      }
    }

    fetchPartidos();
  }, [requestedIdParam, requestedTipoParam]);

  useEffect(() => {
    if (selectedId && selectedTipo === "lobby") cargarLobby(selectedId);
  }, [selectedId, selectedTipo, cargarLobby]);

  function handleSelect(id: number, tipo: Partido["tipo"]) {
    const partido = partidos.find((p) => p.id === id && p.tipo === tipo);
    if (!partido) return;
    setSelectedId(id);
    setSelectedTipo(partido.tipo);
    if (isMobile) setSheetOpen(true);
  }

  async function handleCancelarReserva() {
    if (!selectedId) return;
    await fetch(`/api/reserva/${selectedId}`, { method: "DELETE" });
    setPartidos((prev) => prev.filter((p) => p.id !== selectedId));
    setSelectedId(null);
    setSelectedTipo(null);
  }

  const selectedPartido = partidos.find((p) => p.id === selectedId && p.tipo === selectedTipo) ?? null;

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
      return <ReservaDetail reserva={selectedPartido} onCancelarReserva={handleCancelarReserva} />;
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
        onCancelarLobby={cancelarLobby}
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
              selectedTipo={selectedTipo}
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

export default function MisPartidosPage() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <MisPartidosContent />
    </Suspense>
  );
}
