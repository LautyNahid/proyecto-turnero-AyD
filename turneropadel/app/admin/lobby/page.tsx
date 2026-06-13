"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LobbyConRelaciones } from "@/lib/repositories/lobby.repository";

// ─── Types ────────────────────────────────────────────────────────────────────

type EstadoBadgeConfig = {
  label: string;
  className: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, EstadoBadgeConfig> = {
  Abierto:    { label: "Abierto",    className: "bg-lime/20 text-lime-foreground" },
  Confirmado: { label: "Confirmado", className: "bg-success/15 text-success" },
  Finalizado: { label: "Finalizado", className: "bg-muted text-muted-foreground" },
  Cancelado:  { label: "Cancelado",  className: "bg-destructive/15 text-destructive" },
};

function formatFecha(fecha: Date): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function TablaLobbyskeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminLobbyPage() {
  const [lobbies, setLobbies] = useState<LobbyConRelaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<LobbyConRelaciones | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const fetchLobbies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lobby?todos=true");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Error al cargar lobbies");
        return;
      }
      setLobbies(json.data as LobbyConRelaciones[]);
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLobbies();
  }, [fetchLobbies]);

  async function handleCancelar() {
    if (!cancelTarget) return;
    setCancelando(true);

    try {
      const res = await fetch(`/api/lobby/${cancelTarget.id_lobby}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado_lobby: "Cancelado" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Error al cancelar el lobby");
        return;
      }
      await fetchLobbies();
    } catch {
      setError("Error de red");
    } finally {
      setCancelando(false);
      setCancelTarget(null);
    }
  }

  return (
    <AppShell title="Gestión de Lobbies" subtitle="Vista administrativa — todos los lobbies">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {!loading && `${lobbies.length} lobbies en total`}
          </div>
          <Button variant="outline" size="sm" onClick={fetchLobbies} disabled={loading}>
            Actualizar
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tabla */}
        {loading ? (
          <TablaLobbyskeleton />
        ) : lobbies.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-16">
            No hay lobbies registrados.
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Cancha</TableHead>
                  <TableHead>Organizador</TableHead>
                  <TableHead>Jugadores</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lobbies.map((lobby) => {
                  const badgeConfig = ESTADO_CONFIG[lobby.estado_lobby] ?? ESTADO_CONFIG["Abierto"];
                  const jugadoresActivos = lobby.jugadores.length;
                  const total = jugadoresActivos + lobby.jugadores_faltantes;
                  const cancelable = lobby.estado_lobby === "Abierto" || lobby.estado_lobby === "Confirmado";

                  return (
                    <TableRow key={lobby.id_lobby}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{lobby.id_lobby}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatFecha(lobby.turno.fecha)}
                      </TableCell>
                      <TableCell className="text-sm">{lobby.turno.hora}</TableCell>
                      <TableCell className="text-sm">
                        Cancha {lobby.turno.cancha.nro_cancha}
                      </TableCell>
                      <TableCell className="text-sm">
                        {lobby.creador.usuario.nombre} {lobby.creador.usuario.apellido}
                      </TableCell>
                      <TableCell className="text-sm">
                        {jugadoresActivos}/{total}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${badgeConfig.className}`}
                        >
                          {badgeConfig.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {cancelable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setCancelTarget(lobby)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Dialog confirmación cancelar */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar lobby</DialogTitle>
            <DialogDescription>
              {cancelTarget && (
                <>
                  Vas a cancelar el lobby #{cancelTarget.id_lobby} del{" "}
                  {formatFecha(cancelTarget.turno.fecha)} a las {cancelTarget.turno.hora} en la
                  Cancha {cancelTarget.turno.cancha.nro_cancha}. Esta acción no se puede deshacer.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelTarget(null)}
              disabled={cancelando}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelar}
              disabled={cancelando}
            >
              {cancelando ? "Cancelando..." : "Confirmar cancelación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}