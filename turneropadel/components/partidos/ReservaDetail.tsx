"use client";

import { useState } from "react";
import { MapPin, Clock, Users, Loader2, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClima } from "@/hooks/useClima";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PartidoReserva } from "@/lib/types";

interface ReservaDetailProps {
  reserva: PartidoReserva;
  onCancelarReserva: () => Promise<void>;
}

export function ReservaDetail({ reserva, onCancelarReserva }: ReservaDetailProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  async function handleCancelar() {
    setCancelando(true);
    await onCancelarReserva();
    setCancelando(false);
    setConfirmOpen(false);
  }

  const { clima, estado: climaEstado, error: climaError } = useClima(reserva.fecha_clima ?? null, reserva.hora ?? null);

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6 text-primary-foreground shadow-[var(--shadow-card)]"
        style={{ background: "var(--gradient-court)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-primary-foreground/60">
              Próximo partido
            </div>
            <div className="mt-1 text-3xl font-bold">
              {reserva.fecha} · {reserva.hora}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-primary-foreground/80">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" />
                {reserva.club} · {reserva.cancha}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5 shrink-0" />
                {reserva.duracionMin} min
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-3.5 shrink-0" />
                {reserva.jugadoresConfirmados} jugadores confirmados
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
              <Cloud className="size-5 text-primary shrink-0" />
              {climaEstado === "loading" ? (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" /> Consultando el clima...
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
          <button
            onClick={() => setConfirmOpen(true)}
            className="text-xs bg-red-500 hover:bg-red-600 active:bg-red-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white font-semibold transition shrink-0 shadow-[0_0_12px_rgba(239,68,68,0.5)] hover:shadow-[0_0_16px_rgba(239,68,68,0.7)]"
          >
            Cancelar reserva
          </button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar reserva</DialogTitle>
            <DialogDescription>
              Esta acción cancela tu reserva del {reserva.fecha} a las {reserva.hora} en {reserva.cancha}. No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={cancelando}>
              Volver
            </Button>
            <Button variant="destructive" onClick={handleCancelar} disabled={cancelando}>
              {cancelando && <Loader2 className="size-4 animate-spin" />}
              Cancelar reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}