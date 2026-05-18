import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarRange, MapPin, Users2, Cloud, Clock, ChevronRight, Plus, Trophy, Flame } from "lucide-react";

const openMatches = [
  { id: 1, club: "Club Norte", court: "Cancha 3", date: "Hoy · 20:00", level: "5ta–6ta", filled: 3, price: 2400, weather: "22°" },
  { id: 2, club: "Padel House", court: "Cancha 1", date: "Mañana · 19:30", level: "4ta–5ta", filled: 2, price: 2800, weather: "18°" },
  { id: 3, club: "La Pulpera", court: "Cancha 2", date: "Jue · 21:00", level: "6ta–7ma", filled: 3, price: 2200, weather: "20°" },
  { id: 4, club: "Smash Center", court: "Cancha 4", date: "Vie · 18:00", level: "5ta", filled: 1, price: 2600, weather: "24°" },
];

const upcoming = [
  { id: 1, club: "Club Norte", date: "Hoy", time: "20:00", court: "Cancha 3", players: ["MR", "JL", "PA", "DE"] },
  { id: 2, club: "Padel House", date: "Sáb", time: "10:30", court: "Cancha 1", players: ["MR", "JL", "?", "?"] },
];

export default function Home() {
  return (
    <AppShell title="Hola, Martín" subtitle="¿Listo para jugar tu próximo partido?">
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

      <section>
        <SectionHeader
          title="Partidos abiertos"
          subtitle="Sumate a un partido que necesita jugadores"
          action={{ label: "Crear nuevo", href: "/lobby", icon: true }}
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {openMatches.map((m) => (
            <Link href="/lobby" key={m.id} className="bg-card rounded-2xl p-5 shadow-soft border border-border hover:shadow-card hover:-translate-y-0.5 transition group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime text-lime-foreground">
                  {4 - m.filled} {4 - m.filled === 1 ? "lugar" : "lugares"}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Cloud className="size-3" />{m.weather}
                </span>
              </div>
              <div className="mt-3 font-bold leading-tight">{m.club}</div>
              <div className="text-xs text-muted-foreground">{m.court} · {m.level}</div>
              <div className="mt-3 text-sm font-semibold flex items-center gap-1.5">
                <Clock className="size-3.5" />{m.date}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <div className="flex -space-x-1.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`size-6 rounded-full ring-2 ring-card text-[9px] font-bold flex items-center justify-center ${i < m.filled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-dashed border-border"}`}>
                      {i < m.filled ? "•" : "+"}
                    </div>
                  ))}
                </div>
                <div className="text-sm font-bold">${m.price}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone?: "primary" | "lime" }) {
  const bg = tone === "primary" ? "bg-primary text-primary-foreground" : tone === "lime" ? "bg-lime text-lime-foreground" : "bg-card border border-border";
  return (
    <div className={`rounded-2xl p-4 shadow-soft ${bg}`}>
      <Icon className="size-4 opacity-70" />
      <div className="mt-3 text-2xl font-bold leading-none">{value}</div>
      <div className="text-[11px] mt-1 opacity-70">{label}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: { label: string; href: string; icon?: boolean } }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && (
        <Link href={action.href} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
          {action.icon && <Plus className="size-4" />}
          {action.label}
        </Link>
      )}
    </div>
  );
}