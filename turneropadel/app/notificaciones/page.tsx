"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Bell, CheckCheck } from "lucide-react";
import { TipoNotificacion, EstadoNotificacion } from "@prisma/client";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Notificacion {
  id_notificacion: number;
  tipo: TipoNotificacion;
  estado: EstadoNotificacion;
  creada_en: string;
  enviada_en: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function labelTipo(tipo: TipoNotificacion): string {
  const labels: Record<TipoNotificacion, string> = {
    LobbyConfirmado: "¡Tu lobby fue confirmado!",
    RecordatorioTurno: "Recordatorio de turno",
    TurnoFinalizado: "Turno finalizado",
    SolicitudRechazada: "Tu solicitud fue rechazada",
    SolicitudAceptada: "¡Tu solicitud fue aceptada!",
    JugadorExpulsado: "Fuiste expulsado del lobby",
    CancelacionLobby: "Un lobby fue cancelado",
  };
  return labels[tipo];
}

function formatFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNotificaciones() {
      try {
        const res = await fetch("/api/notificaciones");
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Error al cargar notificaciones");
          return;
        }
        setNotificaciones(json.data as Notificacion[]);
      } catch {
        setError("Error de red");
      } finally {
        setLoading(false);
      }
    }

    fetchNotificaciones();
  }, []);

  async function marcarLeida(id_notificacion: number) {
    try {
      const res = await fetch(`/api/notificaciones/${id_notificacion}`, {
        method: "PATCH",
      });
      if (!res.ok) return;

      setNotificaciones((prev) =>
        prev.map((n) =>
          n.id_notificacion === id_notificacion
            ? { ...n, estado: EstadoNotificacion.Enviada }
            : n
        )
      );
    } catch {
      // silencioso
    }
  }

  const pendientes = notificaciones.filter(
    (n) => n.estado === EstadoNotificacion.Pendiente
  );
  const leidas = notificaciones.filter(
    (n) => n.estado !== EstadoNotificacion.Pendiente
  );

  return (
    <AppShell
      title="Notificaciones"
      subtitle="Tus alertas y novedades"
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-muted rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-40 text-destructive text-sm">
          {error}
        </div>
      ) : notificaciones.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
          <Bell className="size-8" />
          <span className="text-sm">No tenés notificaciones</span>
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">

          {/* ── Pendientes ── */}
          {pendientes.length > 0 && (
            <section>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                Nuevas
              </div>
              <div className="space-y-2">
                {pendientes.map((n) => (
                  <div
                    key={n.id_notificacion}
                    className="bg-card border border-primary/20 rounded-2xl p-4 shadow-soft flex items-start gap-4"
                  >
                    <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bell className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">
                        {labelTipo(n.tipo)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatFecha(n.creada_en)}
                      </div>
                    </div>
                    <button
                      onClick={() => marcarLeida(n.id_notificacion)}
                      className="text-xs text-primary font-semibold hover:underline shrink-0"
                    >
                      Marcar leída
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Leídas ── */}
          {leidas.length > 0 && (
            <section>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                Anteriores
              </div>
              <div className="space-y-2">
                {leidas.map((n) => (
                  <div
                    key={n.id_notificacion}
                    className="bg-card border border-border rounded-2xl p-4 shadow-soft flex items-start gap-4 opacity-60"
                  >
                    <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <CheckCheck className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">
                        {labelTipo(n.tipo)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatFecha(n.creada_en)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </AppShell>
  );
}