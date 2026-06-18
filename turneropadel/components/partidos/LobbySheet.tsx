"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Loader2 } from "lucide-react";
import type { LobbyConRelaciones } from "@/lib/repositories/lobby.repository";
import { parseLocalDate } from "@/lib/utils";

interface LobbySheetProps {
  lobby: LobbyConRelaciones | null;
  open: boolean;
  onClose: () => void;
}

export function LobbySheet({ lobby, open, onClose }: LobbySheetProps) {
  const [solicitando, setSolicitando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSolicitando(false);
      setEnviado(false);
      setError(null);
    }
  }, [open]);

  async function handleSolicitar() {
    if (!lobby) return;
    setSolicitando(true);
    setError(null);

    try {
      const res = await fetch(`/api/lobby/${lobby.id_lobby}/solicitud`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Error al enviar la solicitud");
        return;
      }
      setEnviado(true);
    } catch {
      setError("Error de red");
    } finally {
      setSolicitando(false);
    }
  }

  if (!lobby) return null;

  const fecha = parseLocalDate(lobby.turno.fecha).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Detalle del lobby</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Info */}
          <div
            className="rounded-2xl p-5 text-primary-foreground"
            style={{ background: "var(--gradient-court)" }}
          >
            <div className="text-xs uppercase tracking-wider text-primary-foreground/60">
              Partido
            </div>
            <div className="mt-1 text-2xl font-bold capitalize">
              {fecha} · {lobby.turno.hora}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-primary-foreground/80">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                Cancha {lobby.turno.cancha.nro_cancha}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                90 min
              </span>
            </div>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime text-lime-foreground text-xs font-bold">
              {lobby.jugadores_faltantes === 1
                ? "Falta 1 jugador"
                : `Faltan ${lobby.jugadores_faltantes} jugadores`}
            </div>
          </div>

          {/* Jugadores */}
          <div>
            <h4 className="font-bold mb-3 text-sm">
              Jugadores ({lobby.jugadores.length}/
              {lobby.jugadores.length + lobby.jugadores_faltantes})
            </h4>
            <div className="space-y-2">
              {lobby.jugadores.map((lj) => (
                <div
                  key={lj.id_jugador}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl p-3"
                >
                  <div className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                    {lj.jugador.usuario.nombre[0]}
                    {lj.jugador.usuario.apellido[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {lj.jugador.usuario.nombre} {lj.jugador.usuario.apellido}
                      {lj.id_jugador === lobby.id_creador && (
                        <span className="ml-1.5 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                          Host
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Cat. {lj.jugador.categoria}
                    </div>
                  </div>
                </div>
              ))}
              {Array.from({ length: lobby.jugadores_faltantes }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 border border-dashed border-border rounded-xl p-3 bg-muted/30"
                >
                  <div className="size-9 rounded-full bg-card border border-dashed text-muted-foreground flex items-center justify-center font-bold text-sm shrink-0">
                    +
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Lugar disponible
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Acción */}
          {enviado ? (
            <div className="bg-success/15 text-success px-4 py-3 rounded-xl text-sm font-semibold text-center">
              ✓ Solicitud enviada — esperá que el organizador la acepte
            </div>
          ) : (
            <Button
              className="w-full rounded-full"
              onClick={handleSolicitar}
              disabled={solicitando}
            >
              {solicitando ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Solicitar ingreso"
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}