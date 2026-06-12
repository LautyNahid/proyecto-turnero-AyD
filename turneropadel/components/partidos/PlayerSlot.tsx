"use client";

import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JugadorSlot } from "@/lib/types";

interface PlayerSlotProps {
  jugador: JugadorSlot;
}

export function PlayerSlot({ jugador }: PlayerSlotProps) {
  const isEmpty = jugador.status === "empty";
  const isPending = jugador.status === "pending";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 flex items-center gap-3 transition",
        isEmpty
          ? "border-dashed border-border bg-muted/30"
          : "bg-card border-border shadow-[var(--shadow-soft)]",
      )}
    >
      <div
        className={cn(
          "size-12 rounded-full flex items-center justify-center font-bold shrink-0",
          isEmpty
            ? "bg-card border border-dashed text-muted-foreground"
            : "bg-primary text-primary-foreground",
        )}
      >
        {jugador.initials}
      </div>

      <div className="flex-1 min-w-0">
        {isEmpty ? (
          <>
            <div className="font-semibold text-sm">Lugar disponible</div>
            <div className="text-xs text-muted-foreground">Invitá o aceptá solicitudes</div>
          </>
        ) : (
          <>
            <div className="font-semibold text-sm flex items-center gap-1.5 truncate">
              {jugador.name}
              {jugador.host && (
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                  Host
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Cat. {jugador.level} · {jugador.side}
            </div>
          </>
        )}
      </div>

      {jugador.status === "confirmed" && (
        <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-success/15 text-success shrink-0">
          Confirmado
        </span>
      )}
      {isPending && (
        <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-warning/20 text-warning-foreground shrink-0">
          Pendiente
        </span>
      )}
      {isEmpty && (
        <button className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 shrink-0">
          <UserPlus className="size-4" />
        </button>
      )}
    </div>
  );
}