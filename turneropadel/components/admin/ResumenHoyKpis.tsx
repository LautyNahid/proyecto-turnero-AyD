"use client";

import { useEffect, useState } from "react";

function hoy(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function esHoy(fecha: unknown): boolean {
  return typeof fecha === "string" && fecha.slice(0, 10) === hoy();
}

function KpiCard({ label, valor, error, tone }: { label: string; valor: number | null; error: boolean; tone?: "lime" }) {
  return (
    <div className={`rounded-2xl p-4 shadow-soft ${tone === "lime" ? "bg-lime text-lime-foreground" : "bg-card border border-border"}`}>
      <div className="text-[11px] opacity-70 font-semibold uppercase tracking-wider">{label}</div>
      <div className="mt-2 text-2xl font-bold">{error ? "—" : valor === null ? "..." : valor}</div>
    </div>
  );
}

// ── Reservas hoy ───────────────────────────────────────────────────────────
// /api/reserva no filtra por fecha: trae todas y se filtra por turno.fecha acá.
// Una reserva que viene de un lobby cuenta solo si ese lobby ya está "Confirmado";
// si el lobby sigue abierto buscando jugadores, no cuenta como reserva todavía
// (aunque la fila Reserva ya exista para bloquear el turno).
export function ReservasHoyKpi() {
  const [valor, setValor] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;
    fetch("/api/reserva")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((reservas: unknown) => {
        if (cancelado || !Array.isArray(reservas)) return;
        const total = reservas.filter((r) => {
          const reserva = r as { turno?: { fecha?: unknown }; lobby?: { estado_lobby?: string } | null };
          if (!esHoy(reserva.turno?.fecha)) return false;
          if (reserva.lobby) return reserva.lobby.estado_lobby === "Confirmado";
          return true;
        }).length;
        setValor(total);
      })
      .catch(() => !cancelado && setError(true));
    return () => {
      cancelado = true;
    };
  }, []);

  return <KpiCard label="Reservas hoy" valor={valor} error={error} tone="lime" />;
}

const DEFAULT_HOURS = ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00", "21:30"];

function isPastSlot(fecha: string, hora: string): boolean {
  return new Date(`${fecha}T${hora}:00`).getTime() <= Date.now();
}

// ── Turnos disponibles hoy ───────────────────────────────────────────────────
// Replica la misma lógica que usa la grilla de /reservar:
// pide /api/turno?ocupados=true (trae SOLO turnos ocupados/bloqueados), arma una grilla
// fija de DEFAULT_HOURS x canchas activas, y cuenta "Libre" = no ocupado y no pasado.
export function TurnosDisponiblesHoyKpi() {
  const [valor, setValor] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const fecha = hoy();

    Promise.all([
      fetch("/api/cancha").then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      }),
      fetch(`/api/turno?fechaDesde=${fecha}&fechaHasta=${fecha}&ocupados=true`).then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      }),
    ])
      .then(([canchas, turnosOcupados]: [unknown, unknown]) => {
        if (cancelado || !Array.isArray(canchas) || !Array.isArray(turnosOcupados)) return;

        const activeCanchas = canchas.filter((c) => (c as { activa?: boolean }).activa);

        const ocupados = new Set(
          turnosOcupados.map((t) => {
            const turno = t as { id_cancha: number; hora: string };
            return `${turno.id_cancha}-${turno.hora}`;
          }),
        );

        let total = 0;
        for (const cancha of activeCanchas) {
          const idCancha = (cancha as { id_cancha: number }).id_cancha;
          for (const h of DEFAULT_HOURS) {
            if (ocupados.has(`${idCancha}-${h}`)) continue;
            if (isPastSlot(fecha, h)) continue;
            total += 1;
          }
        }

        setValor(total);
      })
      .catch(() => !cancelado && setError(true));

    return () => {
      cancelado = true;
    };
  }, []);

  return <KpiCard label="Turnos disponibles hoy" valor={valor} error={error} />;
}

// ── Lobbies abiertos hoy ─────────────────────────────────────────────────────
// /api/lobby?todos=true trae todos los lobbies (no solo los del usuario logueado),
// sin filtro de fecha ni estado: se filtra acá por estado_lobby === "Abierto" + turno.fecha de hoy.
export function LobbiesAbiertosHoyKpi() {
  const [valor, setValor] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;
    fetch("/api/lobby?todos=true")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((result: { data?: unknown; error?: unknown }) => {
        if (cancelado) return;
        if (result.error || !Array.isArray(result.data)) throw new Error();
        const total = result.data.filter((l) => {
          const lobby = l as { estado_lobby?: string; turno?: { fecha?: unknown } };
          return lobby.estado_lobby === "Abierto" && esHoy(lobby.turno?.fecha);
        }).length;
        setValor(total);
      })
      .catch(() => !cancelado && setError(true));
    return () => {
      cancelado = true;
    };
  }, []);

  return <KpiCard label="Lobbies abiertos hoy" valor={valor} error={error} />;
}