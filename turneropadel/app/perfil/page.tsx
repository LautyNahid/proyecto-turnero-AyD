"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Trophy, Hand, Target, Edit3 } from "lucide-react";

const tabs = ["Próximos", "Completados", "Cancelados"] as const;
type Tab = typeof tabs[number];

const matches: Record<Tab, { id: number; club: string; date: string; court: string; status: string }[]> = {
  Próximos: [
    { id: 1, club: "Club Norte", date: "Hoy · 20:00", court: "Cancha 3", status: "Confirmado" },
    { id: 2, club: "Padel House", date: "Sáb · 10:30", court: "Cancha 1", status: "Pendiente" },
  ],
  Completados: [
    { id: 3, club: "La Pulpera", date: "Lun · 19:00", court: "Cancha 2", status: "Ganado 6-3 / 7-5" },
    { id: 4, club: "Smash Center", date: "Sáb pasado · 18:00", court: "Cancha 4", status: "Perdido 4-6 / 6-7" },
    { id: 5, club: "Club Norte", date: "Vie · 21:00", court: "Cancha 1", status: "Ganado 6-2 / 6-4" },
  ],
  Cancelados: [
    { id: 6, club: "Padel House", date: "Mar pasado · 19:30", court: "Cancha 3", status: "Cancelado por lluvia" },
  ],
};

export default function Perfil() {
  const [tab, setTab] = useState<Tab>("Próximos");

  return (
    <AppShell title="Mi perfil" subtitle="Tus datos y tu historial deportivo">
      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border shadow-card p-6 text-center relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-24" style={{ background: "var(--gradient-court)" }} />
            <div className="relative">
              <div className="size-24 rounded-full bg-lime text-lime-foreground text-3xl font-bold flex items-center justify-center mx-auto ring-4 ring-card mt-6">
                MR
              </div>
              <div className="mt-3 font-bold text-lg">Martín Rodríguez</div>
              <div className="text-xs text-muted-foreground">@martinr · Buenos Aires</div>
              <button className="mt-3 text-xs inline-flex items-center gap-1 text-primary font-semibold hover:underline">
                <Edit3 className="size-3" /> Editar perfil
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-5 pt-5 border-t border-border text-left">
              <StatItem label="Nivel" value="5ta" icon={Trophy} />
              <StatItem label="Posición" value="Drive" icon={Target} />
              <StatItem label="Mano" value="Diestra" icon={Hand} />
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-soft p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Estadísticas</div>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Partidos jugados" value="42" />
              <Row label="Victorias" value="28 (66%)" />
              <Row label="Compañeros" value="18" />
              <Row label="Clubes visitados" value="6" />
            </div>
          </div>
        </div>

        <div>
          <div className="flex gap-1 bg-muted rounded-full p-1 w-fit mb-4">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-1.5 text-sm font-semibold rounded-full transition ${tab === t ? "bg-card shadow-soft" : "text-muted-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {matches[tab].map((m) => (
              <div key={m.id} className="bg-card border border-border rounded-2xl p-4 shadow-soft flex items-center gap-4">
                <div className="size-12 rounded-xl bg-secondary flex items-center justify-center font-bold text-sm text-secondary-foreground">
                  {m.club.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{m.club}</div>
                  <div className="text-xs text-muted-foreground">{m.date} · {m.court}</div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                  tab === "Próximos"
                    ? m.status === "Confirmado" ? "bg-success/15 text-success" : "bg-warning/20 text-warning-foreground"
                    : tab === "Completados"
                    ? m.status.startsWith("Ganado") ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div>
      <Icon className="size-3.5 text-muted-foreground" />
      <div className="text-sm font-bold mt-1">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}