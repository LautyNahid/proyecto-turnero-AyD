"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LobbyCard, LobbyCardSkeleton } from "@/components/partidos/LobbyCard";
import { LobbySheet } from "@/components/partidos/LobbySheet";
import { CalendarRange, MapPin, Users2, Clock, ChevronRight, Trophy, Flame, Star, MessageCircle } from "lucide-react";
import { usePerfil } from "@/hooks/usePerfil";
import { useAgenda } from "@/hooks/useAgenda";
import type { LobbyConRelaciones } from "@/lib/repositories/lobby.repository";

// ─── Mock data Par 1 (no tocar) ───────────────────────────────────────────────

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { user, isLoaded } = useUser();
  const idUsuario = isLoaded ? user?.id ?? null : null;
  const { perfil } = usePerfil(idUsuario);
  const { agenda } = useAgenda(idUsuario);
  const [now] = useState(() => Date.now());
  const [lobbies, setLobbies] = useState<LobbyConRelaciones[]>([]);
  const [loadingLobbies, setLoadingLobbies] = useState(true);
  const [selectedLobby, setSelectedLobby] = useState<LobbyConRelaciones | null>(null);
  const proximos = agenda.filter((reserva) => reserva.turno.estado_turno !== "Finalizado");
  const proximosOrdenados = proximos
    .map((reserva) => ({
      reserva,
      fechaTurno: getTurnoDate(reserva.turno.fecha, reserva.turno.hora),
    }))
    .filter(({ fechaTurno }) => fechaTurno.getTime() >= now)
    .sort((a, b) => a.fechaTurno.getTime() - b.fechaTurno.getTime())
    .slice(0, 2);
  const valoracion = perfil ? Number(perfil.reputacion_promedio).toFixed(1) : "-";
  const cantidadValoraciones = perfil ? String(perfil.evaluaciones_recibidas) : "-";

  useEffect(() => {
    async function fetchLobbies() {
      try {
        const res = await fetch("/api/lobby?todos=true");
        const json = await res.json();
        if (res.ok) setLobbies(json.data as LobbyConRelaciones[]);
      } catch {
        // silencioso — la sección simplemente no muestra lobbies
      } finally {
        setLoadingLobbies(false);
      }
    }
    fetchLobbies();
  }, []);

  return (
    <AppShell title="Hola, Martín" subtitle="¿Listo para jugar tu próximo partido?">

      {/* ── Hero + Stats — no tocar ─────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div
          className="lg:col-span-2 rounded-2xl p-6 lg:p-8 text-primary-foreground relative overflow-hidden shadow-card"
          style={{ background: "var(--gradient-court)" }}
        >
          <div className="absolute -right-10 -top-10 size-48 rounded-full bg-lime/20 blur-2xl" />
          <div className="absolute right-8 top-8 hidden md:flex items-center gap-1.5 text-xs bg-white/10 px-3 py-1.5 rounded-full backdrop-blur">
            <Flame className="size-3.5 text-lime" /> Racha de 4 partidos
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight max-w-md">
            Reservá tu cancha en <span className="text-lime">menos de 30 segundos</span>
          </h2>
          <p className="mt-2 text-primary-foreground/70 max-w-md text-sm">
            Encontrá horarios disponibles, armá partido y reservá tu lugar.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/reservar" className="inline-flex items-center gap-2 bg-lime text-lime-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition">
              <CalendarRange className="size-4" /> Reservar turno
            </Link>
            <Link href="/lobby" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-white/15 transition">
              <Users2 className="size-4" /> Crear partido
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={Trophy} label="Partidos jugados" value={String(perfil?.partidos_jugados ?? "-")} tone="primary" />
          <StatCard icon={MessageCircle} label="Valoraciones" value={cantidadValoraciones} />
          <StatCard icon={Clock} label="Próximos" value={String(proximos.length)} />
          <StatCard icon={Star} label="Valoración" value={valoracion} tone="lime" />
        </div>
      </section>

      {/* ── Próximos turnos — no tocar (Par 1) ─────────────────────────── */}
      <section className="mb-8">
        <SectionHeader title="Próximos turnos" action={{ label: "Ver todos", href: "/perfil" }} />
        <div className="grid md:grid-cols-2 gap-4">
          {proximosOrdenados.length === 0 ? (
            <div className="md:col-span-2 bg-card rounded-2xl p-5 shadow-soft border border-border text-center text-sm text-muted-foreground">
              No tenés turnos próximos.
            </div>
          ) : (
            proximosOrdenados.map(({ reserva, fechaTurno }) => (
              <Link
                key={reserva.id_reserva}
                href={`/partidos?tipo=reserva&id=${reserva.id_reserva}`}
                className="bg-card rounded-2xl p-5 shadow-soft border border-border flex items-center gap-4 hover:border-primary/40 transition"
              >
                <div className="text-center bg-secondary rounded-xl px-4 py-2 min-w-16">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {formatTurnoDay(fechaTurno)}
                  </div>
                  <div className="text-xl font-bold">{reserva.turno.hora}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">Cancha {reserva.turno.cancha.nro_cancha}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3" /> {formatTurnoDate(fechaTurno)}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-muted-foreground">
                    {reserva.turno.estado_turno}
                  </div>
                </div>
                <ChevronRight className="text-muted-foreground" />
              </Link>
            ))
          )}
        </div>
      </section>

      {/* ── Partidos abiertos — Par 2 ───────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Partidos abiertos"
          subtitle="Sumate a un partido que necesita jugadores"
          action={{ label: "Crear nuevo", href: "/lobby", icon: true }}
        />
        {loadingLobbies ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <LobbyCardSkeleton key={i} />
            ))}
          </div>
        ) : lobbies.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-12">
            No hay partidos abiertos por el momento.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {lobbies.map((lobby) => (
              <LobbyCard
                key={lobby.id_lobby}
                lobby={lobby}
                onClick={() => setSelectedLobby(lobby)}
              />
            ))}
          </div>
        )}
      </section>

      <LobbySheet
        lobby={selectedLobby}
        open={!!selectedLobby}
        onClose={() => setSelectedLobby(null)}
      />
    </AppShell>
  );
}

function getTurnoDate(fecha: string, hora: string) {
  return new Date(`${fecha.slice(0, 10)}T${hora}:00`);
}

function formatTurnoDay(fecha: Date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (isSameDay(fecha, today)) return "Hoy";
  if (isSameDay(fecha, tomorrow)) return "Mañana";

  return fecha.toLocaleDateString("es-AR", { weekday: "short" });
}

function formatTurnoDate(fecha: Date) {
  return fecha.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
