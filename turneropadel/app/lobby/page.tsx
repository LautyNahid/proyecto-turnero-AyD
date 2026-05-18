"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MapPin, Clock, Cloud, Check, X, UserPlus, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Player = {
  id: number;
  name: string | null;
  initials: string;
  level: string | null;
  side: string | null;
  status: "confirmed" | "pending" | "empty";
  host?: boolean;
};

const players: Player[] = [
  { id: 1, name: "Martín R.", initials: "MR", level: "5ta", side: "Drive", status: "confirmed", host: true },
  { id: 2, name: "Julián L.", initials: "JL", level: "5ta", side: "Revés", status: "confirmed" },
  { id: 3, name: "Pablo A.", initials: "PA", level: "6ta", side: "Drive", status: "pending" },
  { id: 4, name: null, initials: "+", level: null, side: null, status: "empty" },
];

const requests = [
  { id: 1, name: "Diego E.", initials: "DE", level: "5ta", side: "Revés" },
  { id: 2, name: "Tomás P.", initials: "TP", level: "6ta", side: "Drive" },
];

export default function Lobby() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  function handleConfirm() {
    setConfirmed(true);
    setConfirmOpen(false);
  }

  return (
    <AppShell title="Lobby del partido" subtitle="Club Norte · Cancha 3 · Hoy 20:00">
      <div className="max-w-3xl space-y-6">
        <div
          className="rounded-2xl p-6 text-primary-foreground relative overflow-hidden shadow-card"
          style={{ background: "var(--gradient-court)" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-primary-foreground/60">Próximo partido</div>
              <div className="mt-1 text-3xl font-bold">Hoy · 20:00</div>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-primary-foreground/80">
                <span className="flex items-center gap-1"><MapPin className="size-3.5" /> Club Norte · Cancha 3</span>
                <span className="flex items-center gap-1"><Clock className="size-3.5" /> 90 min</span>
                <span className="flex items-center gap-1"><Cloud className="size-3.5" /> 22° despejado</span>
              </div>
            </div>
            <button className="text-xs bg-white/10 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-white/15">
              <Share2 className="size-3.5" /> Compartir
            </button>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime text-lime-foreground text-xs font-bold">
            Falta 1 jugador
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-3">Jugadores (3/4)</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {players.map((p, i) => (
              <div key={i} className={`rounded-2xl border p-4 flex items-center gap-3 transition ${p.status === "empty" ? "border-dashed border-border bg-muted/30" : "bg-card border-border shadow-soft"}`}>
                <div className={`size-12 rounded-full flex items-center justify-center font-bold ${p.status === "empty" ? "bg-card border border-dashed text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
                  {p.initials}
                </div>
                <div className="flex-1 min-w-0">
                  {p.status === "empty" ? (
                    <>
                      <div className="font-semibold text-sm">Lugar disponible</div>
                      <div className="text-xs text-muted-foreground">Invitá o aceptá solicitudes</div>
                    </>
                  ) : (
                    <>
                      <div className="font-semibold text-sm flex items-center gap-1.5 truncate">
                        {p.name}
                        {p.host && <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-accent text-accent-foreground">Host</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">Cat. {p.level} · {p.side}</div>
                    </>
                  )}
                </div>
                {p.status === "confirmed" && <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-success/15 text-success">Confirmado</span>}
                {p.status === "pending" && <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-warning/20 text-warning-foreground">Pendiente</span>}
                {p.status === "empty" && (
                  <button className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90">
                    <UserPlus className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-3">Solicitudes para unirse ({requests.length})</h3>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 shadow-soft">
                <div className="size-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm">
                  {r.initials}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{r.name}</div>
                  <div className="text-xs text-muted-foreground">Cat. {r.level} · {r.side}</div>
                </div>
                <button className="size-9 rounded-full bg-success text-success-foreground flex items-center justify-center hover:opacity-90">
                  <Check className="size-4" />
                </button>
                <button className="size-9 rounded-full bg-muted hover:bg-destructive/15 hover:text-destructive flex items-center justify-center">
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {confirmed ? (
            <div className="inline-flex items-center gap-2 bg-success/15 text-success px-5 py-2.5 rounded-full text-sm font-semibold">
              <Check className="size-4" /> Reserva confirmada
            </div>
          ) : (
            <Button onClick={() => setConfirmOpen(true)} className="rounded-full px-5">
              Confirmar reserva
            </Button>
          )}
          <Button variant="outline" className="rounded-full px-5">
            Cancelar reserva
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar reserva</DialogTitle>
            <DialogDescription>
              Estás por confirmar tu lugar en el partido de hoy a las 20:00 en Club Norte · Cancha 3.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground space-y-1">
            <div><span className="font-semibold text-foreground">Fecha:</span> Hoy · 20:00</div>
            <div><span className="font-semibold text-foreground">Cancha:</span> Club Norte · Cancha 3</div>
            <div><span className="font-semibold text-foreground">Duración:</span> 90 min</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirm}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}