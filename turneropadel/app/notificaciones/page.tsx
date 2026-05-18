import { AppShell } from "@/components/layout/AppShell";
import { Calendar, Users2, Bell, Check } from "lucide-react";

const items = [
  { icon: Calendar, color: "bg-success/15 text-success", title: "Reserva confirmada", body: "Cancha 3 · Hoy 20:00 en Club Norte", time: "hace 5 min", unread: true },
  { icon: Users2, color: "bg-lime/30 text-lime-foreground", title: "Pablo A. se sumó al partido", body: "Lobby 'Hoy 20:00' · Falta 1 jugador", time: "hace 18 min", unread: true },
  { icon: Bell, color: "bg-warning/20 text-warning-foreground", title: "Recordatorio de partido", body: "Mañana 19:30 · Padel House", time: "hace 3 h" },
];

export default function Notificaciones() {
  return (
    <AppShell title="Notificaciones" subtitle="Mantenete al día de tus partidos">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex bg-muted rounded-full p-1">
          {["Todas", "Reservas", "Lobbies"].map((t, i) => (
            <button key={i} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition ${i === 0 ? "bg-card shadow-soft" : "text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
        <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <Check className="size-4" /> Marcar todas como leídas
        </button>
      </div>
      <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden divide-y divide-border">
        {items.map((it, i) => (
          <div key={i} className={`p-4 flex items-start gap-4 hover:bg-muted/40 transition ${it.unread ? "bg-primary/[0.03]" : ""}`}>
            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${it.color}`}>
              <it.icon className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-sm">{it.title}</div>
                {it.unread && <span className="size-1.5 rounded-full bg-lime" />}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">{it.body}</div>
            </div>
            <div className="text-[11px] text-muted-foreground whitespace-nowrap">{it.time}</div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}