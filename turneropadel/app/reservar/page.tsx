"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MapPin, Cloud, ChevronLeft, ChevronRight, Info, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const courts = [
  { id: 1, name: "Cancha 1", type: "Cristal · Indoor", price: 2800 },
  { id: 2, name: "Cancha 2", type: "Cristal · Outdoor", price: 2400 },
  { id: 3, name: "Cancha 3", type: "Panorámica", price: 3200 },
  { id: 4, name: "Cancha 4", type: "Cristal · Indoor", price: 2800 },
];

const hours = ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00", "21:30"];

const days = [
  { d: "LUN", n: 12 },
  { d: "MAR", n: 13, today: true },
  { d: "MIÉ", n: 14 },
  { d: "JUE", n: 15 },
  { d: "VIE", n: 16 },
  { d: "SÁB", n: 17 },
  { d: "DOM", n: 18 },
];

function statusFor(c: number, h: string): "free" | "busy" | "blocked" {
  const seed = (c * 31 + h.charCodeAt(0) + h.charCodeAt(1)) % 10;
  if (seed < 4) return "free";
  if (seed < 7) return "busy";
  if (seed === 9) return "blocked";
  return "free";
}

function addHour(h: string) {
  const [hh, mm] = h.split(":").map(Number);
  const total = hh * 60 + mm + 90;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function Reservar() {
  const [day, setDay] = useState(1);
  const [selected, setSelected] = useState<{ court: number; hour: string } | null>({ court: 3, hour: "20:00" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const selectedCourt = courts.find((c) => c.id === selected?.court);

  function handleConfirm() {
    setConfirmed(true);
    setConfirmOpen(false);
  }

  return (
    <AppShell title="Reservar turno" subtitle="Elegí cancha, día y horario">
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div>
          <div className="bg-card rounded-2xl p-5 border border-border shadow-soft mb-5 flex items-center gap-4">
            <div className="size-14 rounded-xl bg-gradient-to-br from-primary to-sidebar text-primary-foreground flex items-center justify-center font-bold">CN</div>
            <div className="flex-1">
              <div className="font-bold">Club Norte</div>
              <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1"><MapPin className="size-3" /> Av. Libertador 3400</span>
                <span className="flex items-center gap-1"><Cloud className="size-3" /> 22° · Despejado</span>
              </div>
            </div>
            <button className="text-sm text-primary font-semibold hover:underline">Cambiar</button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <button className="size-9 rounded-full bg-card border border-border hover:bg-secondary flex items-center justify-center">
              <ChevronLeft className="size-4" />
            </button>
            <div className="flex-1 grid grid-cols-7 gap-2">
              {days.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setDay(i)}
                  className={`py-2 rounded-xl text-center transition ${day === i ? "bg-primary text-primary-foreground shadow-card" : "bg-card border border-border hover:border-primary/40"}`}
                >
                  <div className="text-[10px] font-semibold opacity-70">{d.d}</div>
                  <div className="text-lg font-bold leading-none mt-0.5">{d.n}</div>
                  {d.today && <div className={`text-[9px] mt-0.5 ${day === i ? "opacity-80" : "text-primary"}`}>Hoy</div>}
                </button>
              ))}
            </div>
            <button className="size-9 rounded-full bg-card border border-border hover:bg-secondary flex items-center justify-center">
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/60">
                    <th className="text-left p-3 font-semibold sticky left-0 bg-secondary/60">Cancha</th>
                    {hours.map((h) => (
                      <th key={h} className="p-3 font-semibold text-xs text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courts.map((c) => (
                    <tr key={c.id} className="border-t border-border">
                      <td className="p-3 sticky left-0 bg-card">
                        <div className="font-semibold text-sm">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.type}</div>
                      </td>
                      {hours.map((h) => {
                        const st = statusFor(c.id, h);
                        const isSel = selected?.court === c.id && selected?.hour === h;
                        const cls = isSel
                          ? "bg-lime text-lime-foreground ring-2 ring-lime"
                          : st === "free"
                          ? "bg-success/15 text-success hover:bg-success/25"
                          : st === "busy"
                          ? "bg-muted text-muted-foreground/60 cursor-not-allowed"
                          : "bg-destructive/10 text-destructive cursor-not-allowed line-through";
                        return (
                          <td key={h} className="p-1.5">
                            <button
                              disabled={st !== "free" && !isSel}
                              onClick={() => setSelected({ court: c.id, hour: h })}
                              className={`w-full h-10 rounded-lg text-xs font-semibold transition ${cls}`}
                            >
                              {isSel ? "✓" : st === "free" ? "Libre" : st === "busy" ? "—" : "✕"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border p-3 flex items-center gap-4 text-xs text-muted-foreground">
              <Legend color="bg-success/40" label="Libre" />
              <Legend color="bg-muted" label="Ocupado" />
              <Legend color="bg-destructive/30" label="Bloqueado" />
              <Legend color="bg-lime" label="Seleccionado" />
            </div>
          </div>
        </div>

        <aside>
          <div className="bg-card rounded-2xl border border-border shadow-card p-6 sticky top-24">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tu reserva</div>
            {selected && selectedCourt ? (
              <>
                <div className="mt-3 text-2xl font-bold tracking-tight">{selectedCourt.name}</div>
                <div className="text-sm text-muted-foreground">
                  Martes 13 · {selected.hour} – {addHour(selected.hour)}
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <Row label="Duración" value="90 min" />
                  <Row label="Tipo" value={selectedCourt.type} />
                  <Row label="Precio cancha" value={`$${selectedCourt.price}`} />
                  <Row label="Por jugador (x4)" value={`$${Math.round(selectedCourt.price / 4)}`} highlight />
                </div>

                <div className="mt-5 p-3 rounded-xl bg-accent/40 text-xs text-foreground/80 flex gap-2">
                  <Info className="size-4 shrink-0 mt-0.5 text-primary" />
                  Podés invitar a tus amigos o dejar el partido abierto para que se sumen jugadores.
                </div>

                <Link
                  href="/lobby"
                  className="mt-5 block w-full text-center bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 transition"
                >
                  Confirmar y armar partido
                </Link>

                {confirmed ? (
                  <div className="mt-2 w-full flex items-center justify-center gap-2 bg-success/15 text-success font-semibold py-3 rounded-xl text-sm">
                    <Check className="size-4" /> Reserva confirmada
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmOpen(true)}
                    className="mt-2 block w-full text-center bg-secondary text-secondary-foreground font-semibold py-3 rounded-xl hover:bg-accent transition"
                  >
                    Reservar para mí
                  </button>
                )}
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Seleccioná un horario libre en la grilla.</p>
            )}
          </div>
        </aside>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar reserva</DialogTitle>
            <DialogDescription>
              Revisá los detalles antes de confirmar tu turno.
            </DialogDescription>
          </DialogHeader>
          {selected && selectedCourt && (
            <div className="py-2 text-sm text-muted-foreground space-y-1">
              <div><span className="font-semibold text-foreground">Cancha:</span> {selectedCourt.name} · {selectedCourt.type}</div>
              <div><span className="font-semibold text-foreground">Horario:</span> Martes 13 · {selected.hour} – {addHour(selected.hour)}</div>
              <div><span className="font-semibold text-foreground">Precio:</span> ${selectedCourt.price}</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirm}>Confirmar reserva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`size-3 rounded ${color}`} /> {label}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${highlight ? "pt-3 border-t border-border text-base font-bold" : ""}`}>
      <span className={highlight ? "" : "text-muted-foreground"}>{label}</span>
      <span className={highlight ? "text-primary" : "font-semibold"}>{value}</span>
    </div>
  );
}