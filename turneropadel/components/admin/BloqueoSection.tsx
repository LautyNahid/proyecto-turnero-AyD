"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, Loader2, ShieldOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Cancha = {
  id_cancha: number;
  nro_cancha: number;
  activa: boolean;
};

type Bloqueo = {
  id_bloqueo: number;
  motivo: string;
};

type Turno = {
  id_turno: number;
  id_cancha: number;
  fecha: string;
  hora: string;
  estado_turno: "Disponible" | "Reservado" | "EnCurso" | "Finalizado";
  bloqueos: Bloqueo[];
};

const DEFAULT_HOURS = ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00", "21:30"];
const OCCUPIED_STATES = ["Reservado", "EnCurso", "Finalizado"];
const dayNames = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];

type Selected = { cancha: Cancha; turno?: Turno; fecha: string; hora: string };

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

export function BloqueoSection() {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState(0);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [motivo, setMotivo] = useState("");
  const [motivoError, setMotivoError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [turnoToUnblock, setTurnoToUnblock] = useState<Turno | null>(null);
  const days = useMemo(() => buildDays(), []);
  const selectedDate = days[day];
  const activeCanchas = useMemo(() => canchas.filter((c) => c.activa), [canchas]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [canchasRes, turnosRes] = await Promise.all([
        fetch("/api/cancha", { cache: "no-store" }),
        fetch(`/api/admin/turnos?fechaDesde=${days[0].key}&fechaHasta=${days[6].key}`, {
          cache: "no-store",
        }),
      ]);
      const [canchasData, turnosData] = await Promise.all([canchasRes.json(), turnosRes.json()]);

      if (!canchasRes.ok) throw new Error(canchasData.error ?? "No se pudieron cargar las canchas");
      if (!turnosRes.ok) throw new Error(turnosData.error ?? "No se pudieron cargar los turnos");

      setCanchas(canchasData);
      setTurnos(turnosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la grilla");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const turnosForSelectedDay = useMemo(
    () => turnos.filter((t) => t.fecha.slice(0, 10) === selectedDate.key),
    [selectedDate.key, turnos],
  );

  const hours = useMemo(() => {
    const merged = new Set([...DEFAULT_HOURS, ...turnosForSelectedDay.map((t) => t.hora)]);
    return Array.from(merged).sort();
  }, [turnosForSelectedDay]);

  const turnosByCanchaAndHour = useMemo(() => {
    const map = new Map<string, Turno>();
    for (const t of turnosForSelectedDay) {
      map.set(`${t.id_cancha}-${t.hora}`, t);
    }
    return map;
  }, [turnosForSelectedDay]);

  function handleSelectDay(index: number) {
    setDay(index);
  }

  function abrirDialogBloqueo(cancha: Cancha, turno: Turno | undefined, hora: string) {
    setSelected({ cancha, turno, fecha: selectedDate.key, hora });
    setMotivo("");
    setMotivoError(null);
  }

  function cerrarDialog() {
    setSelected(null);
    setMotivo("");
    setMotivoError(null);
  }

  async function handleBloquear() {
    if (!selected) return;
    if (!motivo.trim()) {
      setMotivoError("El motivo es obligatorio");
      return;
    }

    setProcesando(true);
    setMotivoError(null);
    try {
      const res = await fetch("/api/turno/bloqueos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_cancha: selected.cancha.id_cancha,
          fecha: selected.fecha,
          hora: selected.hora,
          motivo: motivo.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo bloquear el horario");

      cerrarDialog();
      await cargarDatos();
    } catch (err) {
      setMotivoError(err instanceof Error ? err.message : "Error al bloquear");
    } finally {
      setProcesando(false);
    }
  }

  function requestDesbloquear(turno: Turno) {
  setTurnoToUnblock(turno);
  }

  function cancelDesbloquear() {
    setTurnoToUnblock(null);
  }

  async function confirmDesbloquear() {
    if (!turnoToUnblock) return;
    const turno = turnoToUnblock;

    setProcesando(true);
    try {
      const res = await fetch(`/api/turno/${turno.id_turno}/bloqueos`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "No se pudo desbloquear el turno");
      }
      setTurnoToUnblock(null);
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al desbloquear");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <>
      <section className="bg-card rounded-2xl border border-border shadow-soft">
        <div className="p-5 border-b border-border">
          <h3 className="font-bold flex items-center gap-2">
            <Ban className="size-4" /> Bloqueo de horarios
          </h3>
          <p className="text-xs text-muted-foreground">Elegi un horario libre para bloquearlo</p>
        </div>

        {error && (
          <div className="mx-5 mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="p-5 pb-0 grid grid-cols-7 gap-2">
          {days.map((date, index) => (
            <button
              key={date.key}
              onClick={() => handleSelectDay(index)}
              className={`py-2 rounded-xl text-center transition text-xs ${
                day === index
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-accent"
              }`}
            >
              <div className="font-semibold opacity-70">{date.d}</div>
              <div className="font-bold leading-none mt-0.5">{date.n}</div>
            </button>
          ))}
        </div>

        <div className="p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 font-semibold sticky left-0 bg-card">Cancha</th>
                {hours.map((h) => (
                  <th key={h} className="p-2 font-semibold text-xs text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-5 text-muted-foreground" colSpan={hours.length + 1}>
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" /> Cargando grilla
                    </span>
                  </td>
                </tr>
              ) : activeCanchas.length === 0 ? (
                <tr>
                  <td className="p-5 text-muted-foreground" colSpan={hours.length + 1}>
                    No hay canchas activas.
                  </td>
                </tr>
              ) : (
                activeCanchas.map((cancha) => (
                  <tr key={cancha.id_cancha} className="border-t border-border">
                    <td className="p-2 sticky left-0 bg-card font-semibold text-sm">
                      C{cancha.nro_cancha}
                    </td>
                    {hours.map((h) => {
                      const turno = turnosByCanchaAndHour.get(`${cancha.id_cancha}-${h}`);
                      const bloqueado = turno ? turno.bloqueos.length > 0 : false;
                      const ocupado = turno ? OCCUPIED_STATES.includes(turno.estado_turno) : false;
                      const libre = !bloqueado && !ocupado;

                      const cls = bloqueado
                        ? "bg-destructive/10 text-destructive"
                        : ocupado
                        ? "bg-muted text-muted-foreground/60 cursor-not-allowed"
                        : "bg-success/15 text-success hover:bg-success/25";

                      return (
                        <td key={h} className="p-1">
                          <button
                            disabled={ocupado || procesando}
                            onClick={() =>
                              bloqueado && turno
                                ? requestDesbloquear(turno)
                                : abrirDialogBloqueo(cancha, turno, h)
                            }
                            className={`w-full h-9 rounded-lg text-[10px] font-semibold transition ${cls}`}
                            title={
                              bloqueado
                                ? `Bloqueado: ${turno?.bloqueos[0]?.motivo}`
                                : ocupado
                                ? "Turno reservado"
                                : "Click para bloquear"
                            }
                          >
                            {bloqueado ? "Bloq." : ocupado ? "Reserv." : "Libre"}
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
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded bg-success/40" /> Libre (click para bloquear)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded bg-muted" /> Reservado
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded bg-destructive/30" /> Bloqueado (click para desbloquear)
          </span>
        </div>
      </section>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && cerrarDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear horario</DialogTitle>
          </DialogHeader>
          {selected && (
            <p className="text-sm text-muted-foreground">
              Cancha {selected.cancha.nro_cancha} — {selected.fecha} a las {selected.hora}
              {!selected.turno}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo del bloqueo</Label>
            <Input
              id="motivo"
              placeholder="Ej: Mantenimiento de la red"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={procesando}
            />
            {motivoError && <p className="text-sm text-destructive">{motivoError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cerrarDialog} disabled={procesando}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => void handleBloquear()} disabled={procesando}>
              {procesando && <Loader2 className="size-4 animate-spin mr-1" />}
              Confirmar bloqueo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={turnoToUnblock !== null} onOpenChange={(open) => !open && cancelDesbloquear()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desbloquear horario</DialogTitle>
        </DialogHeader>
        {turnoToUnblock && (
          <p className="text-sm text-muted-foreground">
            ¿Desbloquear el turno a las {turnoToUnblock.hora}? Volverá a estar disponible para reservar.
          </p>
        )}
        {error && turnoToUnblock && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={cancelDesbloquear} disabled={procesando}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => void confirmDesbloquear()} disabled={procesando}>
            {procesando && <Loader2 className="size-4 animate-spin mr-1" />}
            Desbloquear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}