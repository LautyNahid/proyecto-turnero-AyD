"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MapPin, Cloud, ChevronLeft, ChevronRight, Info, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Cancha = {
  id_cancha: number;
  nro_cancha: number;
  activa: boolean;
};

type Turno = {
  id_turno: number;
  id_cancha: number;
  fecha: string;
  hora: string;
  precio: string | number;
  estado_turno: "Disponible" | "Reservado" | "EnCurso" | "Finalizado";
};

type SelectedTurno = {
  cancha: Cancha;
  turno?: Turno;
  fecha: string;
  hora: string;
  precio: number;
};

const DEFAULT_HOURS = ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00", "21:30"];
const DEFAULT_PRICE = 12000;
const OCCUPIED_STATES = ["Reservado", "EnCurso", "Finalizado"];

const dayNames = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildDays() {
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    return {
      key: getDateKey(date),
      d: dayNames[date.getDay()],
      n: date.getDate(),
      today: index === 0,
    };
  });
}

function buildTurnosUrl(days: { key: string }[]) {
  const params = new URLSearchParams({
    fechaDesde: days[0].key,
    fechaHasta: days[days.length - 1].key,
    ocupados: "true",
  });

  return `/api/turno?${params.toString()}`;
}

function addHour(h: string) {
  const [hh, mm] = h.split(":").map(Number);
  const total = hh * 60 + mm + 90;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function formatPrice(value: string | number) {
  return Number(value).toLocaleString("es-AR", {
    maximumFractionDigits: 0,
  });
}

export default function Reservar() {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState(0);
  const [selected, setSelected] = useState<SelectedTurno | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [reserving, setReserving] = useState(false);

  const days = useMemo(() => buildDays(), []);
  const selectedDate = days[day];
  const activeCanchas = useMemo(() => canchas.filter((cancha) => cancha.activa), [canchas]);

  const turnosForSelectedDay = useMemo(
    () => turnos.filter((turno) => turno.fecha.slice(0, 10) === selectedDate.key),
    [selectedDate.key, turnos],
  );

  const hours = useMemo(() => {
    const mergedHours = new Set([...DEFAULT_HOURS, ...turnosForSelectedDay.map((turno) => turno.hora)]);
    return Array.from(mergedHours).sort();
  }, [turnosForSelectedDay]);

  const turnosByCanchaAndHour = useMemo(() => {
    const map = new Map<string, Turno>();

    for (const turno of turnosForSelectedDay) {
      map.set(`${turno.id_cancha}-${turno.hora}`, turno);
    }

    return map;
  }, [turnosForSelectedDay]);

  const loadSchedule = useCallback(async () => {
    try {
      const [canchasResponse, turnosResponse] = await Promise.all([
        fetch("/api/cancha", { cache: "no-store" }),
        fetch(buildTurnosUrl(days), { cache: "no-store" }),
      ]);
      const [canchasData, turnosData] = await Promise.all([
        canchasResponse.json(),
        turnosResponse.json(),
      ]);

      if (!canchasResponse.ok) {
        throw new Error(canchasData.error ?? "No se pudieron obtener las canchas");
      }

      if (!turnosResponse.ok) {
        throw new Error(turnosData.error ?? "No se pudieron obtener los turnos");
      }

      setCanchas(canchasData);
      setTurnos(turnosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la grilla");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSchedule();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadSchedule]);

  function handleSelectDay(index: number) {
    setDay(index);
    setSelected(null);
    setConfirmed(false);
  }

  function handleSelectSlot(cancha: Cancha, turno: Turno | undefined, hora: string) {
    setConfirmed(false);
    setSelected({
      cancha,
      turno,
      fecha: selectedDate.key,
      hora,
      precio: turno ? Number(turno.precio) : DEFAULT_PRICE,
    });
  }

  async function handleConfirm() {
    if (!selected) return;

    setReserving(true);
    setError(null);

    try {
      const response = await fetch("/api/reserva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(selected.turno ? { id_turno: selected.turno.id_turno } : {}),
          id_cancha: selected.cancha.id_cancha,
          fecha: selected.fecha,
          hora: selected.hora,
          precio: selected.precio,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo confirmar la reserva");
      }

      await loadSchedule();
      setSelected(null);
      setConfirmed(true);
      setConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo confirmar la reserva");
    } finally {
      setReserving(false);
    }
  }

  return (
    <AppShell title="Reservar turno" subtitle="Elegi cancha, dia y horario">
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div>
          <div className="bg-card rounded-2xl p-5 border border-border shadow-soft mb-5 flex items-center gap-4">
            <div className="size-14 rounded-xl bg-gradient-to-br from-primary to-sidebar text-primary-foreground flex items-center justify-center font-bold">CN</div>
            <div className="flex-1">
              <div className="font-bold">Club Norte</div>
              <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1"><MapPin className="size-3" /> Av. Libertador 3400</span>
                <span className="flex items-center gap-1"><Cloud className="size-3" /> 22 grados - Despejado</span>
              </div>
            </div>
            <button className="text-sm text-primary font-semibold hover:underline">Cambiar</button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {confirmed && (
            <div className="mb-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
              Reserva confirmada. 
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <button className="size-9 rounded-full bg-card border border-border hover:bg-secondary flex items-center justify-center">
              <ChevronLeft className="size-4" />
            </button>
            <div className="flex-1 grid grid-cols-7 gap-2">
              {days.map((date, index) => (
                <button
                  key={date.key}
                  onClick={() => handleSelectDay(index)}
                  className={`py-2 rounded-xl text-center transition ${day === index ? "bg-primary text-primary-foreground shadow-card" : "bg-card border border-border hover:border-primary/40"}`}
                >
                  <div className="text-[10px] font-semibold opacity-70">{date.d}</div>
                  <div className="text-lg font-bold leading-none mt-0.5">{date.n}</div>
                  {date.today && <div className={`text-[9px] mt-0.5 ${day === index ? "opacity-80" : "text-primary"}`}>Hoy</div>}
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
                  {loading ? (
                    <tr className="border-t border-border">
                      <td className="p-5 text-muted-foreground" colSpan={Math.max(hours.length + 1, 2)}>
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" /> Cargando turnos
                        </span>
                      </td>
                    </tr>
                  ) : activeCanchas.length === 0 ? (
                    <tr className="border-t border-border">
                      <td className="p-5 text-muted-foreground" colSpan={Math.max(hours.length + 1, 2)}>
                        No hay canchas activas para reservar.
                      </td>
                    </tr>
                  ) : (
                    activeCanchas.map((cancha) => (
                      <tr key={cancha.id_cancha} className="border-t border-border">
                        <td className="p-3 sticky left-0 bg-card">
                          <div className="font-semibold text-sm">Cancha {cancha.nro_cancha}</div>
                          <div className="text-[11px] text-muted-foreground">Activa</div>
                        </td>
                        {hours.map((h) => {
                          const turno = turnosByCanchaAndHour.get(`${cancha.id_cancha}-${h}`);
                          const isOccupied = turno ? OCCUPIED_STATES.includes(turno.estado_turno) : false;
                          const isSelected =
                            selected?.cancha.id_cancha === cancha.id_cancha &&
                            selected?.fecha === selectedDate.key &&
                            selected?.hora === h;
                          const isAvailable = !isOccupied;
                          const cls = isSelected
                            ? "bg-lime text-lime-foreground ring-2 ring-lime"
                            : isAvailable
                            ? "bg-success/15 text-success hover:bg-success/25"
                            : turno
                            ? "bg-muted text-muted-foreground/60 cursor-not-allowed"
                            : "bg-destructive/10 text-destructive cursor-not-allowed line-through";

                          return (
                            <td key={h} className="p-1.5">
                              <button
                                disabled={!isAvailable}
                                onClick={() => handleSelectSlot(cancha, turno, h)}
                                className={`w-full h-10 rounded-lg text-xs font-semibold transition ${cls}`}
                              >
                                {isSelected ? "OK" : isAvailable ? "Libre" : turno?.estado_turno ?? "-"}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border p-3 flex items-center gap-4 text-xs text-muted-foreground">
              <Legend color="bg-success/40" label="Libre" />
              <Legend color="bg-muted" label="Ocupado" />
              <Legend color="bg-destructive/30" label="Sin turno" />
              <Legend color="bg-lime" label="Seleccionado" />
            </div>
          </div>
        </div>

        <aside>
          <div className="bg-card rounded-2xl border border-border shadow-card p-6 sticky top-24">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tu reserva</div>
            {selected ? (
              <>
                <div className="mt-3 text-2xl font-bold tracking-tight">Cancha {selected.cancha.nro_cancha}</div>
                <div className="text-sm text-muted-foreground">
                  {selected.fecha} - {selected.hora} a {addHour(selected.hora)}
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <Row label="Duracion" value="90 min" />
                  <Row label="Estado" value={selected.turno?.estado_turno ?? "Disponible"} />
                  <Row label="Precio cancha" value={`$${formatPrice(selected.precio)}`} />
                  <Row label="Por jugador (x4)" value={`$${formatPrice(selected.precio / 4)}`} highlight />
                </div>

                <div className="mt-5 p-3 rounded-xl bg-accent/40 text-xs text-foreground/80 flex gap-2">
                  <Info className="size-4 shrink-0 mt-0.5 text-primary" />
                  La reserva queda asociada a tu usuario y el turno pasa a Reservado.
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
                    disabled={selected.turno ? OCCUPIED_STATES.includes(selected.turno.estado_turno) : false}
                    onClick={() => setConfirmOpen(true)}
                    className="mt-2 block w-full text-center bg-secondary text-secondary-foreground font-semibold py-3 rounded-xl hover:bg-accent transition disabled:opacity-50"
                  >
                    Reservar para mi
                  </button>
                )}
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Selecciona un horario libre en la grilla.</p>
            )}
          </div>
        </aside>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar reserva</DialogTitle>
            <DialogDescription>
              Revisa los detalles antes de confirmar tu turno.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="py-2 text-sm text-muted-foreground space-y-1">
              <div><span className="font-semibold text-foreground">Cancha:</span> Cancha {selected.cancha.nro_cancha}</div>
              <div><span className="font-semibold text-foreground">Horario:</span> {selected.fecha} - {selected.hora} a {addHour(selected.hora)}</div>
              <div><span className="font-semibold text-foreground">Precio:</span> ${formatPrice(selected.precio)}</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={reserving}>Cancelar</Button>
            <Button onClick={handleConfirm} disabled={reserving}>
              {reserving && <Loader2 className="size-4 animate-spin" />}
              Confirmar reserva
            </Button>
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
