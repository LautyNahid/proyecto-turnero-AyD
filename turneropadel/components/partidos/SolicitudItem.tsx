"use client";

import { Check, X } from "lucide-react";
import type { Solicitud } from "@/lib/types";

interface SolicitudItemProps {
  solicitud: Solicitud;
  onAceptar: (id: number) => void;
  onRechazar: (id: number) => void;
}

export function SolicitudItem({ solicitud, onAceptar, onRechazar }: SolicitudItemProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 shadow-[var(--shadow-soft)]">
      <div className="size-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm shrink-0">
        {solicitud.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{solicitud.name}</div>
        <div className="text-xs text-muted-foreground">
          Cat. {solicitud.level} · {solicitud.side}
        </div>
      </div>
      <button
        onClick={() => onAceptar(solicitud.id)}
        className="size-9 rounded-full bg-success text-success-foreground flex items-center justify-center hover:opacity-90 shrink-0"
      >
        <Check className="size-4" />
      </button>
      <button
        onClick={() => onRechazar(solicitud.id)}
        className="size-9 rounded-full bg-muted hover:bg-destructive/15 hover:text-destructive flex items-center justify-center shrink-0"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}