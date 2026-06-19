"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  EstadoNotificacion,
  TIPO_NOTIFICACION_LABELS,
  type TipoNotificacion,
} from "@/lib/types/notificacion";

interface Notificacion {
  id_notificacion: number;
  tipo: TipoNotificacion;
  estado: EstadoNotificacion;
  creada_en: string;
  enviada_en: string | null;
}

export function NotificationsDropdown() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function fetchNotificaciones() {
      try {
        const res = await fetch("/api/notificaciones");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Error al cargar notificaciones");
        if (!cancelado) setNotificaciones(json.data as Notificacion[]);
      } catch (err) {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : "Error de red");
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    fetchNotificaciones();

    return () => {
      cancelado = true;
    };
  }, []);

  const ultimas = notificaciones.slice(0, 3);
  const pendientes = notificaciones.some((n) => n.estado === EstadoNotificacion.Pendiente);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative size-9 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition"
          aria-label="Abrir notificaciones"
        >
          <Bell className="size-4" />
          {pendientes && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-lime ring-2 ring-card" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <div className="text-sm font-semibold">Notificaciones</div>
          <div className="text-xs text-muted-foreground">Tus últimas novedades</div>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando...
            </div>
          ) : error ? (
            <div className="px-3 py-6 text-center text-sm text-destructive">{error}</div>
          ) : ultimas.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No tenés notificaciones
            </div>
          ) : (
            <div className="space-y-1">
              {ultimas.map((notificacion) => {
                const pendiente = notificacion.estado === EstadoNotificacion.Pendiente;

                return (
                  <div
                    key={notificacion.id_notificacion}
                    className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-accent/50"
                  >
                    <div className={`mt-0.5 size-8 rounded-full flex shrink-0 items-center justify-center ${pendiente ? "bg-primary/10" : "bg-muted"}`}>
                      {pendiente ? (
                        <Bell className="size-4 text-primary" />
                      ) : (
                        <CheckCheck className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {TIPO_NOTIFICACION_LABELS[notificacion.tipo]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatFecha(notificacion.creada_en)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border p-2">
          <Link
            href="/notificaciones"
            className="flex h-9 items-center justify-center rounded-md text-sm font-semibold text-primary hover:bg-accent"
          >
            Ver más
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
