"use client";

import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import type { Partido } from "@/lib/types";

interface PartidoListItemProps {
  partido: Partido;
  selected: boolean;
  onClick: () => void;
}

const estadoBadge: Record<string, { label: string; className: string }> = {
  Abierto: { label: "LOBBY", className: "bg-lime/30 text-lime-foreground" },
  Confirmado: { label: "RESERVA", className: "bg-success/15 text-success" },
  reserva: { label: "RESERVA", className: "bg-success/15 text-success" },
};

export function PartidoListItem({ partido, selected, onClick }: PartidoListItemProps) {
  const badge =
    partido.tipo === "lobby"
      ? (estadoBadge[partido.estado] ?? estadoBadge["Abierto"])
      : estadoBadge["reserva"];

  const jugadoresLabel =
    partido.tipo === "lobby"
      ? `${partido.jugadores.filter((j) => j.status !== "empty").length}/4 jugadores`
      : `${partido.jugadoresConfirmados} jugadores confirmados`;

  const hayFaltante =
    partido.tipo === "lobby" &&
    partido.jugadores.some((j) => j.status === "empty");

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-all",
        selected
          ? "border-primary/40 bg-accent/60 shadow-[var(--shadow-soft)]"
          : "border-border bg-card hover:bg-accent/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">
            {partido.fecha} · {partido.hora}
          </div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {partido.club} · {partido.cancha}
          </div>
        </div>
        <span className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0", badge.className)}>
          {badge.label}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="size-3.5 shrink-0" />
        <span>{jugadoresLabel}</span>
        {hayFaltante && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-warning-foreground bg-warning/20 px-2 py-0.5 rounded-full">
            Falta jugador
          </span>
        )}
      </div>
    </button>
  );
}