"use client";

import { Check, X, Loader2 } from "lucide-react";

//  Types 

interface SolicitudUI {
  id: number;
  id_jugador: string;
  estado: string;
}

interface SolicitudItemProps {
  solicitud: SolicitudUI;
  loading: boolean;
  onAceptar: (id: number) => Promise<void>;
  onRechazar: (id: number) => Promise<void>;
}

// Component 

export function SolicitudItem({ solicitud, loading, onAceptar, onRechazar }: SolicitudItemProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 shadow-[var(--shadow-soft)]">
      <div className="size-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm shrink-0">
        {solicitud.id_jugador.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">Jugador #{solicitud.id}</div>
        <div className="text-xs text-muted-foreground">Solicitud pendiente</div>
      </div>

      {loading ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground shrink-0" />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}