"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/admin/KpiCard";
import { FilterChip } from "@/components/admin/FilterChip";
import { PartidosAdminTable, PartidosAdminTableSkeleton } from "@/components/admin/PartidosAdminTable";
import { CancelarLobbyDialog } from "@/components/admin/CancelarLobbyDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, CalendarRange, Clock, Users2, CheckCircle2 } from "lucide-react";
import type { LobbyConRelaciones } from "@/lib/repositories/lobby.repository";
import type { ReservaWithRelations } from "@/lib/repositories/reserva.repository";

type Filtro = "todos" | "lobby" | "turno";

export default function AdminPartidosPage() {
  const [lobbies, setLobbies] = useState<LobbyConRelaciones[]>([]);
  const [reservas, setReservas] = useState<ReservaWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [query, setQuery] = useState("");
  const [cancelTarget, setCancelTarget] = useState<LobbyConRelaciones | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resLobbies, resReservas] = await Promise.all([
        fetch("/api/lobby?todos=true"),
        fetch("/api/reserva"),
      ]);
      const lobbiesJson = resLobbies.ok ? await resLobbies.json() : { data: [] };
      const reservasJson = resReservas.ok ? await resReservas.json() : [];

      setLobbies(lobbiesJson.data as LobbyConRelaciones[]);
      setReservas(Array.isArray(reservasJson) ? reservasJson as ReservaWithRelations[] : []);
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      await fetchData();
    } catch {
      setError("Error de red");
    } finally {
      setCancelando(false);
      setCancelTarget(null);
    }
  }

  const stats = useMemo(() => {
    const confirmados =
      lobbies.filter((l) => l.estado_lobby === "Confirmado").length +
      reservas.filter((r) => r.turno.estado_turno === "Reservado").length;
    return {
      total: lobbies.length + reservas.length,
      turnos: reservas.length,
      lobbies: lobbies.length,
      confirmados,
    };
  }, [lobbies, reservas]);

  return (
    <AppShell title="Partidos" subtitle="Listado completo de turnos y lobbies del complejo">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total partidos"   value={String(stats.total)}       icon={<CalendarRange className="size-4" />} />
        <KpiCard label="Turnos normales"  value={String(stats.turnos)}      icon={<Clock className="size-4" />} />
        <KpiCard label="Lobbies abiertos" value={String(stats.lobbies)}     icon={<Users2 className="size-4" />} tone="lime" />
        <KpiCard label="Confirmados"      value={String(stats.confirmados)} icon={<CheckCircle2 className="size-4" />} />
      </div>

      {/* Filtros + búsqueda */}
      <div className="bg-card rounded-2xl border border-border shadow-soft p-4 mb-4 flex flex-col lg:flex-row lg:items-center gap-3">

        {/* Mobile — dropdown */}
        <div className="lg:hidden">
          <Select value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
            <SelectTrigger className="rounded-full bg-muted border-0 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos ({stats.total})</SelectItem>
              <SelectItem value="turno">Turnos normales ({stats.turnos})</SelectItem>
              <SelectItem value="lobby">Lobbies ({stats.lobbies})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop — chips */}
        <div className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-muted">
          <FilterChip active={filtro === "todos"}  onClick={() => setFiltro("todos")}  label="Todos"           count={stats.total} />
          <FilterChip active={filtro === "turno"}  onClick={() => setFiltro("turno")}  label="Turnos normales" count={stats.turnos} />
          <FilterChip active={filtro === "lobby"}  onClick={() => setFiltro("lobby")}  label="Lobbies"         count={stats.lobbies} />
        </div>

        {/* Búsqueda */}
        <div className="flex-1 flex items-center gap-2 px-3 h-10 rounded-full bg-muted text-muted-foreground">
          <Search className="size-4 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por ID, organizador o cancha..."
            className="bg-transparent outline-none flex-1 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <PartidosAdminTableSkeleton />
      ) : (
        <PartidosAdminTable
          lobbies={lobbies}
          reservas={reservas}
          filtro={filtro}
          query={query}
        />
      )}

      <CancelarLobbyDialog
        lobby={cancelTarget}
        cancelando={cancelando}
        onConfirmar={handleCancelar}
        onCerrar={() => setCancelTarget(null)}
      />
    </AppShell>
  );
}