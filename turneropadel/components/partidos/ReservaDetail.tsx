"use client";

import { useState } from "react";
import { MapPin, Clock, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LobbyChat } from "./LobbyChat";
import type { PartidoReserva } from "@/lib/types";

interface ReservaDetailProps {
  reserva: PartidoReserva;
}

export function ReservaDetail({ reserva }: ReservaDetailProps) {
  const [chatOpen, setChatOpen] = useState(false);

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
          </div>
          <button
            className="text-xs bg-red-500 hover:bg-red-600 active:bg-red-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white font-semibold transition shrink-0 shadow-[0_0_12px_rgba(239,68,68,0.5)] hover:shadow-[0_0_16px_rgba(239,68,68,0.7)]"
          >
            Cancelar reserva
          </button>
        </div>
      </div>
    </div>
  );
}