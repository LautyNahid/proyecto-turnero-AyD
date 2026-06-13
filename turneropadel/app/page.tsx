"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LobbyCard, LobbyCardSkeleton } from "@/components/partidos/LobbyCard";
import { LobbySheet } from "@/components/partidos/LobbySheet";
import { CalendarRange, MapPin, Users2, Clock, ChevronRight, Trophy, Flame } from "lucide-react";
import type { LobbyConRelaciones } from "@/lib/repositories/lobby.repository";

// ─── Mock data Par 1 (no tocar) ───────────────────────────────────────────────

const upcoming = [
  { id: 1, club: "Club Norte", date: "Hoy", time: "20:00", court: "Cancha 3", players: ["MR", "JL", "PA", "DE"] },
  { id: 2, club: "Padel House", date: "Sáb", time: "10:30", court: "Cancha 1", players: ["MR", "JL", "?", "?"] },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [lobbies, setLobbies] = useState<LobbyConRelaciones[]>([]);
  const [loadingLobbies, setLoadingLobbies] = useState(true);
  const [selectedLobby, setSelectedLobby] = useState<LobbyConRelaciones | null>(null);

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
          <StatCard icon={Trophy} label="Partidos jugados" value="42" tone="primary" />
          <StatCard icon={Users2} label="Compañeros" value="18" />
          <StatCard icon={Clock} label="Próximos" value="2" />
          <StatCard icon={Flame} label="Racha" value="4" tone="lime" />
        </div>
      </section>

      {/* ── Próximos turnos — no tocar (Par 1) ─────────────────────────── */}
      <section className="mb-8">
        <SectionHeader title="Próximos turnos" action={{ label: "Ver todos", href: "/perfil" }} />
        <div className="grid md:grid-cols-2 gap-4">
          {upcoming.map((u) => (
            <div key={u.id} className="bg-card rounded-2xl p-5 shadow-soft border border-border flex items-center gap-4">
              <div className="text-center bg-secondary rounded-xl px-4 py-2 min-w-16">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{u.date}</div>
                <div className="text-xl font-bold">{u.time}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{u.club}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3" /> {u.court}
                </div>
                <div className="flex -space-x-2 mt-2">
                  {u.players.map((p, i) => (
                    <div key={i} className={`size-7 rounded-full ring-2 ring-card text-[10px] font-bold flex items-center justify-center ${p === "?" ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/lobby" className="text-muted-foreground hover:text-foreground">
                <ChevronRight />
              </Link>
            </div>
          ))}
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