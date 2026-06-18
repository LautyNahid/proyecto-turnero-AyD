"use client";

import { useState } from "react";
import { MapPin, Clock, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  onCancelar: () => Promise<void>;
  cancelando: boolean;
}

export function ReservaDetail({ reserva, onCancelar, cancelando }: ReservaDetailProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleConfirm() {
    await onCancelar();
    setConfirmOpen(false);
  }

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6 text-primary-foreground shadow-[var(--shadow-card)]"
        style={{ background: "var(--gradient-court)" }}
      >
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
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="rounded-full px-5" onClick={() => setConfirmOpen(true)}>
          Cancelar reserva
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(open) => !cancelando && setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar reserva</DialogTitle>
            <DialogDescription>
              ¿Seguro que querés cancelar tu reserva del {reserva.fecha} a las {reserva.hora}?
              Si el lobby ya está confirmado y faltan menos de 12 horas, podrías recibir una penalización.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={cancelando}>
              Volver
            </Button>
            <Button variant="destructive" onClick={() => void handleConfirm()} disabled={cancelando}>
              {cancelando && <Loader2 className="size-4 animate-spin mr-1" />}
              Confirmar cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}