import { AppShell } from "@/components/layout/AppShell";
import { TrendingUp, TrendingDown, Download } from "lucide-react";

const peakHours = [
  { h: "08", v: 30 }, { h: "10", v: 45 }, { h: "12", v: 35 }, { h: "14", v: 50 },
  { h: "16", v: 65 }, { h: "18", v: 88 }, { h: "20", v: 95 }, { h: "22", v: 70 },
];

const revenueByCourt = [
  { name: "Cancha 1", v: 92, color: "bg-primary" },
  { name: "Cancha 2", v: 74, color: "bg-success" },
  { name: "Cancha 3", v: 58, color: "bg-lime" },
  { name: "Cancha 4", v: 81, color: "bg-warning" },
];

export default function Reportes() {
  return (
    <AppShell title="Reportes" subtitle="Indicadores clave del complejo">
      <div className="flex justify-end mb-4">
        <button className="inline-flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-secondary">
          <Download className="size-3.5" /> Exportar CSV
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Metric title="Ingresos del mes" value="$842.300" delta="+18%" up />
        <Metric title="Tasa de cancelación" value="4.2%" delta="-1.1%" up />
        <Metric title="Ocupación promedio" value="71%" delta="+6%" up />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Horarios pico" subtitle="Reservas por hora">
          <div className="h-56 flex items-end gap-3 pt-4">
            {peakHours.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-[10px] font-bold text-muted-foreground">{d.v}</div>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/60" style={{ height: `${d.v}%` }} />
                <div className="text-xs text-muted-foreground">{d.h}h</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Ingresos por cancha" subtitle="Últimos 30 días">
          <div className="space-y-4 mt-4">
            {revenueByCourt.map((r, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-semibold">{r.name}</span>
                  <span className="text-muted-foreground">${(r.v * 1850).toLocaleString()}</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Cancelaciones" subtitle="Por motivo">
          <div className="space-y-3 mt-4 text-sm">
            <Row label="Lluvia" value="42%" />
            <Row label="Falta de jugadores" value="28%" />
            <Row label="Cambio de horario" value="18%" />
            <Row label="Otros" value="12%" />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Metric({ title, value, delta, up }: { title: string; value: string; delta: string; up?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{title}</div>
      <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
      <div className={`mt-1 text-xs font-semibold inline-flex items-center gap-1 ${up ? "text-success" : "text-destructive"}`}>
        {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />} {delta}
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <h3 className="font-bold">{title}</h3>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
      {children}
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