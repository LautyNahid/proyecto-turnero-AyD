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
import { useClima } from "@/hooks/useClima";
import dynamic from "next/dynamic";
import { JugadoresFaltantesDefault } from "@/lib/types";

type Cancha = {
  id_cancha: number;
  nro_cancha: number;
  activa: boolean;
  precio: number | null;
};

type Turno = {
  id_turno: number;
  id_cancha: number;
  fecha: string;
  hora: string;
  precio: string | number;
  estado_turno: "Disponible" | "Reservado" | "EnCurso" | "Finalizado";
  bloqueos: { id_bloqueo: number; motivo: string }[];
};

type SelectedTurno = {
  cancha: Cancha;
  turno?: Turno;
  fecha: string;
  hora: string;
  precio: number;
};

const DEFAULT_HOURS = ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00", "21:30"];
const OCCUPIED_STATES = ["Reservado", "EnCurso", "Finalizado"];

const dayNames = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];

const HORA_INICIO_RECARGO = "18:00";
const RECARGO_HORARIO_PICO = 1.10;

const MapaComplejo = dynamic(
  () => import("@/components/mapa/MapaComplejo").then((mod) => mod.MapaComplejo),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Cargando mapa...</p> },
);

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

function calcularPrecioEstimado(precioBaseCancha: number | null, hora: string) {
  if (precioBaseCancha === null) return 0;
  const esPico = hora >= HORA_INICIO_RECARGO;
  return esPico ? Math.round(precioBaseCancha * RECARGO_HORARIO_PICO * 100) / 100 : precioBaseCancha;
}

function formatPrice(value: string | number) {
  return Number(value).toLocaleString("es-AR", {
    maximumFractionDigits: 0,
  });
}

function isPastSlot(fecha: string, hora: string) {
  return new Date(`${fecha}T${hora}:00`).getTime() <= Date.now();
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
  const [lobbyOpen, setLobbyOpen] = useState(false);
  const [creatingLobby, setCreatingLobby] = useState(false);
  const [lobbyCreated, setLobbyCreated] = useState(false);

  const days = useMemo(() => buildDays(), []);
  const selectedDate = days[day];
  const activeCanchas = useMemo(() => canchas.filter((cancha) => cancha.activa), [canchas]);

  const { clima, estado: climaEstado, error: climaError } = useClima(
    selected?.fecha ?? null,
    selected?.hora ?? null,
  );

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
    const precioEstimado = turno
      ? Number(turno.precio)
      : calcularPrecioEstimado(cancha.precio, hora);

    setSelected({
      cancha,
      turno,
      fecha: selectedDate.key,
      hora,
      precio: precioEstimado,
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

  async function handleCreateLobby() {
    if (!selected) return;

    setCreatingLobby(true);
    setError(null);

    try {
      const response = await fetch("/api/lobby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(selected.turno ? { id_turno: selected.turno.id_turno } : {}),
          id_cancha: selected.cancha.id_cancha,
          fecha: selected.fecha,
          hora: selected.hora,
          jugadores_faltantes: JugadoresFaltantesDefault,
          precio: selected.precio
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo crear el lobby");
      }

      await loadSchedule();

      setSelected(null);
      setLobbyCreated(true);
      setLobbyOpen(false);

      // Opcional:
      // router.push(`/lobby/${data.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear el lobby"
      );
    } finally {
      setCreatingLobby(false);
    }
  }

  return (
    <AppShell title="Reservar turno" subtitle="Elegi cancha, dia y horario">
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div>
          <div className="bg-card rounded-2xl p-5 border border-border shadow-soft mb-5 flex items-center gap-4">
            <div className="size-14 rounded-xl bg-gradient-to-br from-primary to-sidebar text-primary-foreground flex items-center justify-center font-bold">CP</div>
            <div className="flex-1">
              <div className="font-bold">ComplejoPadel</div>
              <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1"><MapPin className="size-3" /> San Andres 800</span>
              </div>
            </div>
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

          {lobbyCreated && (
            <div className="mb-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
              Lobby creado correctamente.
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            
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
                          <div className="font-semibold text-sm whitespace-nowrap">Cancha {cancha.nro_cancha}</div>
                          
                        </td>
                        {hours.map((h) => {
                          const turno = turnosByCanchaAndHour.get(`${cancha.id_cancha}-${h}`);
                          const isPast = isPastSlot(selectedDate.key, h);
                          const isOccupied = turno
                            ? OCCUPIED_STATES.includes(turno.estado_turno) || turno.bloqueos.length > 0
                            : false;
                          const isSelected =
                            selected?.cancha.id_cancha === cancha.id_cancha &&
                            selected?.fecha === selectedDate.key &&
                            selected?.hora === h;
                          const isAvailable = !isOccupied && !isPast;
                          const isBlocked = turno ? turno.bloqueos.length > 0 : false;
                          const cls = isSelected
                            ? "bg-lime text-lime-foreground ring-2 ring-lime"
                            : isAvailable
                            ? "bg-success/15 text-success hover:bg-success/25"
                            : isPast
                            ? "bg-muted text-muted-foreground/60 cursor-not-allowed"
                            : isBlocked
                            ? "bg-destructive/15 text-destructive cursor-not-allowed"
                            : turno
                            ? "bg-muted text-muted-foreground/60 cursor-not-allowed"
                            : "bg-destructive/10 text-destructive cursor-not-allowed line-through";

                          return (
                            <td key={h} className="p-1.5">
                             <button
                                disabled={!isAvailable}
                                onClick={() => handleSelectSlot(cancha, turno, h)}
                                className={`h-10 min-w-[84px] rounded-lg px-2 text-xs font-semibold transition ${cls}`}
                              >
                                {isSelected
                                  ? "OK"
                                  : isAvailable
                                  ? "Libre"
                                  : isPast
                                  ? "No disp."
                                  : turno && turno.bloqueos.length > 0
                                  ? "Bloqueado"
                                  : turno?.estado_turno ?? "-"}
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
            <Legend color="bg-muted" label="Reservado" />
            <Legend color="bg-destructive/30" label="Bloqueado" />
            <Legend color="bg-lime" label="Seleccionado" />
          </div>
          </div>

          {activeCanchas.length > 0 && (
            <div className="mt-6 bg-card rounded-2xl border border-border shadow-soft p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                Ubicacion del complejo
              </div>
              <MapaComplejo idCancha={activeCanchas[0].id_cancha} />
            </div>
          )}
        </div>

        <aside className="self-start">
          <div className="bg-card rounded-2xl border border-border shadow-card p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tu reserva</div>
            {selected ? (
              <>
                <div className="mt-3 text-2xl font-bold tracking-tight">Cancha {selected.cancha.nro_cancha}</div>
                <div className="text-sm text-muted-foreground">
                  {selected.fecha} - {selected.hora} a {addHour(selected.hora)}
                </div>

                <div className="mt-2 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                <Cloud className="size-5 text-primary shrink-0" />
                {climaEstado === "loading" ? (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" /> Consultando el clima...
                  </span>
                ) : climaError ? (
                  <span className="text-muted-foreground">{climaError}</span>
                ) : clima ? (
                  <span className="font-semibold">
                    {Math.round(clima.temperatura_celsius)}&deg; - {clima.descripcion}
                  </span>
                ) : null}
              </div>

                <div className="mt-5 space-y-3 text-sm">
                  <Row label="Duracion" value="90 min" />
                  <Row label="Estado" value={selected.turno?.estado_turno ?? "Disponible"} />
                  <Row label="Precio cancha" value={`$${formatPrice(selected.precio)}`} />
                  <Row label="Por jugador (x4)" value={`$${formatPrice(selected.precio / 4)}`} highlight />
                </div>

              

                {lobbyCreated ? (
                  <div className="mt-5 w-full flex items-center justify-center gap-2 bg-success/15 text-success font-semibold py-3 rounded-xl text-sm">
                    <Check className="size-4" />
                    Lobby creado
                  </div>
                ) : (
                  <button
                    disabled={selected.turno ? OCCUPIED_STATES.includes(selected.turno.estado_turno) : false}
                    onClick={() => setLobbyOpen(true)}
                    className="mt-5 block w-full text-center bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
                  >
                    Confirmar y armar partido
                  </button>
                )}

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

      <Dialog open={lobbyOpen} onOpenChange={setLobbyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar creación del lobby</DialogTitle>
            <DialogDescription>
              Se creará un lobby asociado a este turno para que otros jugadores puedan unirse.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="py-2 text-sm text-muted-foreground space-y-1">
              <div><span className="font-semibold text-foreground">Cancha: </span>{" "} Cancha {selected.cancha.nro_cancha} </div>
              <div><span className="font-semibold text-foreground">Horario: </span>{" "} {selected.fecha} - {selected.hora} a{" "} {addHour(selected.hora)}</div>
              <div><span className="font-semibold text-foreground">Precio: </span>{" "} ${formatPrice(selected.precio)}</div></div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLobbyOpen(false)} disabled={creatingLobby}>Cancelar</Button>
            <Button onClick={handleCreateLobby} disabled={creatingLobby}>
              {creatingLobby && (<Loader2 className="size-4 animate-spin" />)}
              Crear lobby
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
