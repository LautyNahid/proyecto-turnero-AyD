"use client";

import { MapPin, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PartidoReserva } from "@/lib/types";

interface ReservaDetailProps {
  reserva: PartidoReserva;
}

export function ReservaDetail({ reserva }: ReservaDetailProps) {
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
        <Button variant="outline" className="rounded-full px-5">
          Cancelar reserva
        </Button>
      </div>
    </div>
  );
}