import { CanchasCrudProvider, CanchasCrudSection, CanchasKpi } from "@/components/admin/CanchasCrud";
import { AppShell } from "@/components/layout/AppShell";
import { BloqueoSection } from "@/components/admin/BloqueoSection";

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

        <div className="space-y-6">
          <div className="space-y-6">
            <CanchasCrudSection />

            <BloqueoSection />
          </div>
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