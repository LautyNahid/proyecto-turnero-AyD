"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LobbyCard, LobbyCardSkeleton } from "@/components/partidos/LobbyCard";
import { LobbySheet } from "@/components/partidos/LobbySheet";
import {
  CalendarRange,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Star,
  MessageCircle,
} from "lucide-react";
import { usePerfil } from "@/hooks/usePerfil";
import { useAgenda } from "@/hooks/useAgenda";
import type { LobbyConRelaciones } from "@/lib/repositories/lobby.repository";

const LOBBIES_PER_PAGE = 12;

// ─── Mock data Par 1 (no tocar) ───────────────────────────────────────────────

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { user, isLoaded } = useUser();
  const idUsuario = isLoaded ? (user?.id ?? null) : null;
  const { perfil } = usePerfil(idUsuario);
  const { agenda } = useAgenda(idUsuario);
  const [now] = useState(() => Date.now());
  const [lobbies, setLobbies] = useState<LobbyConRelaciones[]>([]);
  const [lobbiesPage, setLobbiesPage] = useState(0);
  const [loadingLobbies, setLoadingLobbies] = useState(true);
  const [selectedLobby, setSelectedLobby] = useState<LobbyConRelaciones | null>(
    null,
  );
  const proximos = agenda.filter(
    (reserva) => reserva.turno.estado_turno !== "Finalizado",
  );
  const proximosOrdenados = proximos
    .map((reserva) => ({
      reserva,
      fechaTurno: getTurnoDate(reserva.turno.fecha, reserva.turno.hora),
    }))
    .filter(({ fechaTurno }) => fechaTurno.getTime() >= now)
    .sort((a, b) => a.fechaTurno.getTime() - b.fechaTurno.getTime())
    .slice(0, 2);
  const valoracion = perfil
    ? Number(perfil.reputacion_promedio).toFixed(1)
    : "-";
  const cantidadValoraciones = perfil
    ? String(perfil.evaluaciones_recibidas)
    : "-";
  const totalLobbyPages = Math.max(1, Math.ceil(lobbies.length / LOBBIES_PER_PAGE));
  const currentLobbyPage = Math.min(lobbiesPage, totalLobbyPages - 1);
  const lobbiesVisibles = lobbies.slice(
    currentLobbyPage * LOBBIES_PER_PAGE,
    currentLobbyPage * LOBBIES_PER_PAGE + LOBBIES_PER_PAGE,
  );

  useEffect(() => {
    async function fetchLobbies() {
      try {
        const res = await fetch("/api/lobby?todos=true");
        const json = await res.json();
        if (res.ok) {
          const lobbiesVigentes = (json.data as LobbyConRelaciones[]).filter(
            (lobby) => lobby.estado_lobby !== "Finalizado" && lobby.turno?.estado_turno !== "Finalizado",
          );
          setLobbies(lobbiesVigentes);
          setLobbiesPage(0);
        }
      } catch {
        // silencioso — la sección simplemente no muestra lobbies
      } finally {
        setLoadingLobbies(false);
      }
    }
    fetchLobbies();
  }, []);

  return (
    <AppShell
      title={`Hola, ${user?.firstName || 'Jugador'}`}
      subtitle="¿Listo para jugar tu próximo partido?"
    >
      {/* ── Hero + Stats — no tocar ─────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div
          className="lg:col-span-2 rounded-2xl p-6 lg:p-8 text-primary-foreground relative overflow-hidden shadow-card"
          style={{ background: "var(--gradient-court)" }}
        >
          <div className="absolute -right-10 -top-10 size-48 rounded-full bg-lime/20 blur-2xl" />
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight max-w-md">
            Reservá tu cancha en{" "}
            <span className="text-lime">menos de 30 segundos</span>
          </h2>
          <p className="mt-2 text-primary-foreground/70 max-w-md text-sm">
            Encontrá horarios disponibles, armá partido y reservá tu lugar.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/reservar"
              className="inline-flex items-center gap-2 bg-lime text-lime-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition"
            >
              <CalendarRange className="size-4" /> Reservar turno
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={Trophy}
            label="Partidos jugados"
            value={String(perfil?.partidos_jugados ?? "-")}
            tone="primary"
          />
          <StatCard
            icon={MessageCircle}
            label="Valoraciones"
            value={cantidadValoraciones}
          />
          <StatCard
            icon={Clock}
            label="Próximos"
            value={String(proximos.length)}
          />
          <StatCard
            icon={Star}
            label="Valoración"
            value={valoracion}
            tone="lime"
          />
        </div>
      </section>

      {/* ── Próximos turnos — no tocar (Par 1) ─────────────────────────── */}
      <section className="mb-8">
        <SectionHeader
          title="Próximos turnos"
          action={{ label: "Ver todos", href: "/perfil" }}
        />
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
                  <div className="font-semibold truncate">
                    Cancha {reserva.turno.cancha.nro_cancha}
                  </div>
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
          <div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {lobbiesVisibles.map((lobby) => (
                <LobbyCard
                  key={lobby.id_lobby}
                  lobby={lobby}
                  onClick={() => setSelectedLobby(lobby)}
                />
              ))}
            </div>
            {lobbies.length > LOBBIES_PER_PAGE && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setLobbiesPage((page) => Math.max(0, page - 1))}
                  disabled={currentLobbyPage === 0}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Pagina anterior de lobbies"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="min-w-28 text-center font-semibold text-muted-foreground">
                  {currentLobbyPage + 1} de {totalLobbyPages}
                </span>
                <button
                  type="button"
                  onClick={() => setLobbiesPage((page) => Math.min(totalLobbyPages - 1, page + 1))}
                  disabled={currentLobbyPage >= totalLobbyPages - 1}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Pagina siguiente de lobbies"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
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
