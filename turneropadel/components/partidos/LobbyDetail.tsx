"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { MapPin, Clock, MessageSquare , Share2, Check, UserMinus, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LobbyChat } from "./LobbyChat";
import { useClima } from "@/hooks/useClima";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlayerSlot } from "./PlayerSlot";
import { SolicitudItem } from "./SolicitudItem";
import type { LobbyConRelaciones } from "@/lib/repositories/lobby.repository";
import type { JugadorSlot } from "@/lib/types";
import { parseLocalDate } from "@/lib/utils";

// Types 

interface LobbyDetailProps {
  lobby: LobbyConRelaciones;
  onAceptarSolicitud: (id_solicitud: number) => Promise<void>;
  onRechazarSolicitud: (id_solicitud: number) => Promise<void>;
  onExpulsarJugador: (id_jugador: string) => Promise<void>;
  onCancelarLobby: () => Promise<void>;
}


//  Mappers 

type JugadorSlotLocal = Omit<JugadorSlot, "id"> & { id: string };

function toJugadorSlot(
  jugador: LobbyConRelaciones["jugadores"][number],
  esCreador: boolean
): JugadorSlotLocal {
  return {
    id: jugador.id_jugador,  // string
    name: `${jugador.jugador.usuario.nombre} ${jugador.jugador.usuario.apellido}`,
    initials: `${jugador.jugador.usuario.nombre[0]}${jugador.jugador.usuario.apellido[0]}`,
    level: `Cat. ${jugador.jugador.categoria}`,
    side: null,
    status: "confirmed" as const,
    host: esCreador,
  };
}

function toSolicitudUI(solicitud: LobbyConRelaciones["solicitudes"][number]) {
  return {
    id: solicitud.id_solicitud,
    id_jugador: solicitud.id_jugador,
    estado: solicitud.estado_solicitud,
  };
}

// Component 

export function LobbyDetail({
  lobby,
  onAceptarSolicitud,
  onRechazarSolicitud,
  onExpulsarJugador,
  onCancelarLobby,
}: LobbyDetailProps) {
  const { user } = useUser();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const esOrganizador = user?.id === lobby.id_creador;
  const solicitudesPendientes = lobby.solicitudes.filter(
    (s) => s.estado_solicitud === "Pendiente"
  );
  const jugadoresConfirmados = lobby.jugadores.length;
  const lugaresVacios = lobby.jugadores_faltantes;
  const tieneTurno = Boolean(lobby.turno);
  const fecha = tieneTurno
    ? parseLocalDate(lobby.turno!.fecha).toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "Turno no asignado";
  const hora = lobby.turno?.hora ?? "—";
  const cancha = lobby.turno?.cancha?.nro_cancha ?? "—";
  const nombreLobby = tieneTurno ? `Cancha ${cancha} · ${hora}` : "Turno no asignado";
  const fechaClima = lobby.turno
    ? (() => {
        const localDate = parseLocalDate(lobby.turno!.fecha);
        return `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;
      })()
    : null;
  const { clima, estado: climaEstado, error: climaError } = useClima(fechaClima, lobby.turno?.hora ?? null);
  const [chatOpen, setChatOpen] = useState(false);

  async function handleAceptar(id_solicitud: number) {
    setLoadingId(id_solicitud);
    await onAceptarSolicitud(id_solicitud);
    setLoadingId(null);
  }

  async function handleRechazar(id_solicitud: number) {
    setLoadingId(id_solicitud);
    await onRechazarSolicitud(id_solicitud);
    setLoadingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className="rounded-2xl p-6 text-primary-foreground relative overflow-hidden shadow-[var(--shadow-card)]"
        style={{ background: "var(--gradient-court)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-primary-foreground/60">
              Próximo partido
            </div>
            <div className="mt-1 text-3xl font-bold capitalize">{fecha} · {hora}</div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-primary-foreground/80">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" />
                Cancha {cancha}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5 shrink-0" />
                90 min
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
              <Cloud className="size-5 text-primary shrink-0" />
              {climaEstado === "loading" ? (
                <span className="text-muted-foreground flex items-center gap-1">
                  <span className="animate-spin">⏳</span> Consultando el clima...
                </span>
              ) : climaError ? (
                <span className="text-muted-foreground">{climaError}</span>
              ) : clima ? (
                <span className="font-semibold text-foreground">
                  {Math.round(clima.temperatura_celsius)}° - {clima.descripcion}
                </span>
              ) : (
                <span className="text-muted-foreground">Clima no disponible</span>
              )}
            </div>
          </div>
            {esOrganizador && lobby.estado_lobby !== "Cancelado" && (
              <button
                onClick={() => setConfirmOpen(true)}
                className="text-xs bg-red-500 hover:bg-red-600 active:bg-red-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white font-semibold transition shrink-0 shadow-[0_0_12px_rgba(239,68,68,0.5)] hover:shadow-[0_0_16px_rgba(239,68,68,0.7)]"
              >
                Cancelar lobby
              </button>
            )}
        </div>
        {lugaresVacios > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime text-lime-foreground text-xs font-bold">
            {lugaresVacios === 1 ? "Falta 1 jugador" : `Faltan ${lugaresVacios} jugadores`}
          </div>
        )}
        {lobby.estado_lobby === "Confirmado" && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/20 text-success text-xs font-bold">
            <Check className="size-3.5" /> Partido confirmado
          </div>
        )}
      </div>

      {/* Jugadores */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">
            Jugadores ({jugadoresConfirmados}/{jugadoresConfirmados + lugaresVacios})
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-4 text-xs"
            onClick={() => setChatOpen(true)}
          >
            <MessageSquare className="size-3.5" />
            Chat del partido
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {lobby.jugadores.map((lj) => (
            <div key={lj.id_jugador} className="relative">
              <PlayerSlot jugador={toJugadorSlot(lj, lj.id_jugador === lobby.id_creador)} />
              {esOrganizador && lj.id_jugador !== lobby.id_creador && lobby.estado_lobby === "Abierto" && (
                <button
                  onClick={() => onExpulsarJugador(lj.id_jugador)}
                  className="absolute top-2 right-2 size-7 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive flex items-center justify-center transition"
                  title="Expulsar jugador"
                >
                  <UserMinus className="size-3.5" />
                </button>
              )}
            </div>
          ))}
          {Array.from({ length: lugaresVacios }).map((_, i) => (
            <PlayerSlot
              key={`empty-${i}`}
              jugador={{ id: -(i + 1), name: null, initials: "+", level: null, side: null, status: "empty" }}
            />
          ))}
        </div>
      </div>

      {/* Solicitudes — solo organizador */}
      {esOrganizador && solicitudesPendientes.length > 0 && (
        <div>
          <h3 className="font-bold mb-3">
            Solicitudes para unirse ({solicitudesPendientes.length})
          </h3>
          <div className="space-y-2">
            {solicitudesPendientes.map((s) => {
              const ui = toSolicitudUI(s);
              return (
                <SolicitudItem
                  key={ui.id}
                  solicitud={ui}
                  loading={loadingId === ui.id}
                  onAceptar={handleAceptar}
                  onRechazar={handleRechazar}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Dialog cancelar */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar lobby</DialogTitle>
            <DialogDescription>
              Esta acción cancela el lobby del {fecha} a las {hora} en la Cancha {cancha}. No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Volver
            </Button>
            <Button variant="destructive" onClick={async () => {
              await onCancelarLobby();
              setConfirmOpen(false);
            }}>
              Cancelar lobby
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LobbyChat
        open={chatOpen}
        onOpenChange={setChatOpen}
        nombreLobby={nombreLobby}
      />
    </div>
  );
}
