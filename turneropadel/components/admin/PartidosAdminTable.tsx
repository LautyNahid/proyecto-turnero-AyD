import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, MoreHorizontal, Users2, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn, parseLocalDate } from "@/lib/utils";
import type { LobbyConRelaciones } from "@/lib/repositories/lobby.repository";
import type { ReservaWithRelations } from "@/lib/repositories/reserva.repository";

// ─── Types ────────────────────────────────────────────────────────────────────

type EstadoLobby = "Abierto" | "Confirmado" | "Finalizado" | "Cancelado";
type EstadoTurno = "Disponible" | "Reservado" | "EnCurso" | "Finalizado";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFecha(fecha: string | Date | null | undefined): string {
  if (fecha === null || fecha === undefined) return "Sin fecha";
  return parseLocalDate(fecha).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function TypeBadge({ tipo }: { tipo: "lobby" | "turno" }) {
  if (tipo === "lobby") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-lime/30 text-foreground px-2 py-1 rounded-full">
        <Users2 className="size-3" /> Lobby
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
      <Clock className="size-3" /> Turno
    </span>
  );
}

function StatusBadge({ estado }: { estado: EstadoLobby | EstadoTurno }) {
  const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    Abierto:    { cls: "bg-warning/20 text-warning-foreground", icon: <AlertCircle className="size-3" />, label: "Pendiente" },
    Confirmado: { cls: "bg-success/15 text-success",            icon: <CheckCircle2 className="size-3" />, label: "Confirmado" },
    Finalizado: { cls: "bg-muted text-muted-foreground",         icon: <CheckCircle2 className="size-3" />, label: "Finalizado" },
    Cancelado:  { cls: "bg-destructive/10 text-destructive",    icon: <XCircle className="size-3" />,      label: "Cancelado" },
    Reservado:  { cls: "bg-success/15 text-success",            icon: <CheckCircle2 className="size-3" />, label: "Confirmado" },
    EnCurso:    { cls: "bg-lime/20 text-lime-foreground",       icon: <CheckCircle2 className="size-3" />, label: "En curso" },
    Disponible: { cls: "bg-muted text-muted-foreground",         icon: <AlertCircle className="size-3" />,  label: "Disponible" },
  };

  const config = map[estado] ?? map["Disponible"];

  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full", config.cls)}>
      {config.icon} {config.label}
    </span>
  );
}

function PlayersBar({ players, capacity }: { players: number; capacity: number }) {
  const pct = capacity > 0 ? (players / capacity) * 100 : 0;
  const full = players === capacity;

  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full", full ? "bg-success" : "bg-lime")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums">{players}/{capacity}</span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function PartidosAdminTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PartidosAdminTableProps {
  lobbies: LobbyConRelaciones[];
  reservas: ReservaWithRelations[];
  filtro: "todos" | "lobby" | "turno";
  query: string;
  onCancelarReserva: (reserva: ReservaWithRelations) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PartidosAdminTable({ lobbies, reservas, filtro, query, onCancelarReserva }: PartidosAdminTableProps) {
  const q = query.toLowerCase().trim();

  const filasLobby = lobbies
    .filter(() => filtro === "todos" || filtro === "lobby")
    .filter((l) => {
      if (!q) return true;
      return (
        String(l.id_lobby).includes(q) ||
        `${l.creador.usuario.nombre} ${l.creador.usuario.apellido}`.toLowerCase().includes(q) ||
        `cancha ${l.turno?.cancha?.nro_cancha ?? "sin turno"}`.toLowerCase().includes(q)
      );
    });

  const filasReserva = reservas
    .filter(() => filtro === "todos" || filtro === "turno")
    .filter((r) => {
      if (!q) return true;
      return (
        String(r.id_reserva).includes(q) ||
        `${r.jugador.usuario.nombre} ${r.jugador.usuario.apellido}`.toLowerCase().includes(q) ||
        `cancha ${r.turno.cancha.nro_cancha}`.toLowerCase().includes(q)
      );
    });

  const totalFiltrado = filasLobby.length + filasReserva.length;
  const totalGeneral = lobbies.length + reservas.length;

  if (totalFiltrado === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-16">
        No se encontraron partidos con los filtros aplicados.
      </div>
    );
  }

  return (
    <section className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/40">
            <tr>
              <th className="text-left p-3 pl-5">ID</th>
              <th className="text-left p-3">ID Turno</th>
              <th className="text-left p-3">Tipo</th>
              <th className="text-left p-3">Fecha · Hora</th>
              <th className="text-left p-3">Cancha</th>
              <th className="text-left p-3">Organizador</th>
              <th className="text-left p-3">Jugadores</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-right p-3">Monto</th>
              <th className="p-3 pr-5" />
            </tr>
          </thead>
          <tbody>
            {filasLobby.map((lobby) => {
              const jugadoresActivos = lobby.jugadores.length;
              const capacidad = jugadoresActivos + lobby.jugadores_faltantes;

              return (
                <tr key={`lobby-${lobby.id_lobby}`} className="border-t border-border hover:bg-muted/30">
                  <td className="p-3 pl-5 font-mono text-xs text-muted-foreground">L-{lobby.id_lobby}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">T-{lobby.turno?.id_turno ?? '—'}</td>
                  <td className="p-3"><TypeBadge tipo="lobby" /></td>
                  <td className="p-3">
                    <div className="font-semibold">{formatFecha(lobby.turno?.fecha)}</div>
                    <div className="text-xs text-muted-foreground">{lobby.turno?.hora ?? "—"} hs</div>
                  </td>
                  <td className="p-3">
                    <div className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="size-3.5" /> Cancha {lobby.turno?.cancha?.nro_cancha ?? "—"}
                    </div>
                  </td>
                  <td className="p-3 font-semibold">
                    {lobby.creador.usuario.nombre} {lobby.creador.usuario.apellido}
                  </td>
                  <td className="p-3">
                    <PlayersBar players={jugadoresActivos} capacity={capacidad} />
                  </td>
                  <td className="p-3"><StatusBadge estado={lobby.estado_lobby} /></td>
                  <td className="p-3 text-right font-semibold">
                    ${lobby.turno?.precio ? Number(lobby.turno.precio).toLocaleString("es-AR") : "-"}
                  </td>
                  <td className="p-3 pr-5 text-right">
                    <button className="size-8 rounded-lg hover:bg-muted inline-flex items-center justify-center text-muted-foreground">
                      <MoreHorizontal className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {filasReserva.map((reserva) => (
              <tr key={`reserva-${reserva.id_reserva}`} className="border-t border-border hover:bg-muted/30">
                <td className="p-3 pl-5 font-mono text-xs text-muted-foreground">R-{reserva.id_reserva}</td>
                <td className="p-3 font-mono text-xs text-muted-foreground">T-{reserva.turno.id_turno}</td>
                <td className="p-3"><TypeBadge tipo="turno" /></td>
                <td className="p-3">
                  <div className="font-semibold">{formatFecha(reserva.turno.fecha)}</div>
                  <div className="text-xs text-muted-foreground">{reserva.turno.hora} hs</div>
                </td>
                <td className="p-3">
                  <div className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-3.5" /> Cancha {reserva.turno.cancha.nro_cancha}
                  </div>
                </td>
                <td className="p-3 font-semibold">
                  {reserva.jugador.usuario.nombre} {reserva.jugador.usuario.apellido}
                </td>
                <td className="p-3">
                  <PlayersBar players={4} capacity={4} />
                </td>
                <td className="p-3"><StatusBadge estado={reserva.turno.estado_turno} /></td>
                <td className="p-3 text-right font-semibold">
                  ${Number(reserva.turno.precio).toLocaleString("es-AR")}
                </td>
                <td className="p-3 pr-5 text-right">
                  <button
                    onClick={() => onCancelarReserva(reserva)}
                    className="text-xs font-semibold text-destructive hover:underline px-2 py-1 rounded-lg hover:bg-destructive/10"
                  >
                    Cancelar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div>Mostrando {totalFiltrado} de {totalGeneral} partidos</div>
        <div className="flex items-center gap-1">
          <button className="px-2 py-1 rounded hover:bg-muted">‹ Anterior</button>
          <button className="px-2 py-1 rounded hover:bg-muted">Siguiente ›</button>
        </div>
      </div>
    </section>
  );
}