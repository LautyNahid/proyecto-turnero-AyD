"use client";

import { useState } from "react";
import { MapPin, Clock, Cloud, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { PartidoLobby, Solicitud } from "@/lib/types";

interface LobbyDetailProps {
  lobby: PartidoLobby;
}

export function LobbyDetail({ lobby }: LobbyDetailProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(lobby.solicitudes);

  const jugadoresActivos = lobby.jugadores.filter((j) => j.status !== "empty").length;
  const hayFaltante = lobby.jugadores.some((j) => j.status === "empty");

  function handleAceptar(id: number) {
    setSolicitudes((prev) => prev.filter((s) => s.id !== id));
  }

  function handleRechazar(id: number) {
    setSolicitudes((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div
        className="rounded-2xl p-6 text-primary-foreground relative overflow-hidden shadow-[var(--shadow-card)]"
        style={{ background: "var(--gradient-court)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-primary-foreground/60">
              Próximo partido
            </div>
            <div className="mt-1 text-3xl font-bold">
              {lobby.fecha} · {lobby.hora}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-primary-foreground/80">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" />
                {lobby.club} · {lobby.cancha}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5 shrink-0" />
                {lobby.duracionMin} min
              </span>
              {lobby.clima && (
                <span className="flex items-center gap-1">
                  <Cloud className="size-3.5 shrink-0" />
                  {lobby.clima}
                </span>
              )}
            </div>
          </div>
          <button className="text-xs bg-white/10 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-white/15 shrink-0">
            <Share2 className="size-3.5" /> Compartir
          </button>
        </div>
        {hayFaltante && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime text-lime-foreground text-xs font-bold">
            Falta {lobby.jugadores.filter((j) => j.status === "empty").length} jugador
          </div>
        )}
      </div>

      {/* Jugadores */}
      <div>
        <h3 className="font-bold mb-3">Jugadores ({jugadoresActivos}/4)</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {lobby.jugadores.map((jugador) => (
            <PlayerSlot key={jugador.id} jugador={jugador} />
          ))}
        </div>
      </div>

      {/* Solicitudes */}
      {solicitudes.length > 0 && (
        <div>
          <h3 className="font-bold mb-3">Solicitudes para unirse ({solicitudes.length})</h3>
          <div className="space-y-2">
            {solicitudes.map((s) => (
              <SolicitudItem
                key={s.id}
                solicitud={s}
                onAceptar={handleAceptar}
                onRechazar={handleRechazar}
              />
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap gap-3">
        {confirmed ? (
          <div className="inline-flex items-center gap-2 bg-success/15 text-success px-5 py-2.5 rounded-full text-sm font-semibold">
            <Check className="size-4" /> Reserva confirmada
          </div>
        ) : (
          <Button onClick={() => setConfirmOpen(true)} className="rounded-full px-5">
            Confirmar reserva
          </Button>
        )}
        <Button variant="outline" className="rounded-full px-5">
          Cancelar reserva
        </Button>
      </div>

      {/* Dialog confirmación */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar reserva</DialogTitle>
            <DialogDescription>
              Estás por confirmar tu lugar en el partido del {lobby.fecha} a las {lobby.hora} en{" "}
              {lobby.club} · {lobby.cancha}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground space-y-1">
            <div>
              <span className="font-semibold text-foreground">Fecha:</span> {lobby.fecha} · {lobby.hora}
            </div>
            <div>
              <span className="font-semibold text-foreground">Cancha:</span> {lobby.club} · {lobby.cancha}
            </div>
            <div>
              <span className="font-semibold text-foreground">Duración:</span> {lobby.duracionMin} min
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setConfirmed(true);
                setConfirmOpen(false);
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}