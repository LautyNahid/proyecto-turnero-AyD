import { CanchasCrudProvider, CanchasCrudSection, CanchasKpi } from "@/components/admin/CanchasCrud";
import { AppShell } from "@/components/layout/AppShell";
import { Calendar } from "lucide-react";
import { BloqueoSection } from "@/components/admin/BloqueoSection";

const todayBookings = [
  { time: "08:00", court: "C1", player: "Lucas G.", paid: true },
  { time: "09:30", court: "C2", player: "Sofia M.", paid: true },
  { time: "11:00", court: "C1", player: "-", blocked: true },
  { time: "14:00", court: "C4", player: "Federico R.", paid: false },
  { time: "17:00", court: "C2", player: "Bianca T.", paid: true },
  { time: "18:30", court: "C1", player: "Diego A.", paid: true },
  { time: "20:00", court: "C3", player: "Martin R.", paid: false },
  { time: "21:30", court: "C4", player: "Lautaro V.", paid: true },
];

export default function Admin() {
  return (
    <CanchasCrudProvider>
      <AppShell title="Panel del Complejo" subtitle="ComplejoPadel - Gestion operativa">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Kpi label="Reservas hoy" value="14" delta="+12%" tone="lime" />
          <Kpi label="Ingresos hoy" value="$38.4k" delta="+8%" />
          <CanchasKpi />
          <Kpi label="Cancelaciones" value="3" delta="-2" tone="muted" />
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            <CanchasCrudSection />

            <BloqueoSection />
          </div>

          <aside className="bg-card rounded-2xl border border-border shadow-card overflow-hidden h-fit sticky top-24">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <div>
                <div className="font-bold text-sm">Agenda del dia</div>
                <div className="text-xs text-muted-foreground">Martes 13 - 14 reservas</div>
              </div>
            </div>
            <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
              {todayBookings.map((b, i) => (
                <div key={`${b.time}-${i}`} className="p-3 flex items-center gap-3 hover:bg-muted/40">
                  <div className="text-sm font-bold w-12">{b.time}</div>
                  <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary">{b.court}</div>
                  <div className="flex-1 text-sm truncate">{b.player}</div>
                  {b.blocked ? (
                    <span className="text-[10px] font-bold uppercase text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">Bloq.</span>
                  ) : b.paid ? (
                    <span className="text-[10px] font-bold uppercase text-success bg-success/15 px-2 py-0.5 rounded-full">Pago</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase text-warning-foreground bg-warning/20 px-2 py-0.5 rounded-full">Pend.</span>
                  )}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </AppShell>
    </CanchasCrudProvider>
  );
}

function Kpi({ label, value, delta, tone }: { label: string; value: string; delta: string; tone?: "lime" | "muted" }) {
  return (
    <div className={`rounded-2xl p-4 shadow-soft ${tone === "lime" ? "bg-lime text-lime-foreground" : "bg-card border border-border"}`}>
      <div className="text-[11px] opacity-70 font-semibold uppercase tracking-wider">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <div className={`text-xs mt-1 font-semibold ${tone === "lime" ? "opacity-80" : tone === "muted" ? "text-muted-foreground" : "text-success"}`}>
        {delta} vs ayer
      </div>
    </div>
  );
}