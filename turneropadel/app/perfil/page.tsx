"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Trophy, Hand, Target, Edit3, CalendarRange } from "lucide-react";
import { EvaluacionSheet } from "@/components/evaluaciones/EvaluacionSheet";

// ─── Tipos ───────────────────────────────────────────────────────────────────

const tabs = ["Próximos", "Completados", "Cancelados"] as const;
type Tab = typeof tabs[number];

interface Partido {
  id: number;
  club: string;
  date: string;
  court: string;
  status: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Perfil() {
  const [tab, setTab] = useState<Tab>("Próximos");
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<Partido | null>(null);

  return (
    <AppShell title="Mi perfil" subtitle="Tus datos y tu historial deportivo">
      <div className="grid lg:grid-cols-[340px_1fr] gap-6">

        {/* ── Columna izquierda ── */}
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
              <Row label="Partidos jugados" value="0" />
              <Row label="Victorias" value="0" />
              <Row label="Compañeros" value="0" />
              <Row label="Clubes visitados" value="0" />
            </div>
          </div>
        </div>

        {/* ── Columna derecha ── */}
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

          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <CalendarRange className="size-8" />
            <span className="text-sm">No hay partidos para mostrar</span>
          </div>
        </div>
      </div>

      {/* ── Sheet de evaluación ── */}
      <EvaluacionSheet
        partido={partidoSeleccionado}
        open={!!partidoSeleccionado}
        onClose={() => setPartidoSeleccionado(null)}
      />
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