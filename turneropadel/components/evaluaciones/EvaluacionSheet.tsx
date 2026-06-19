"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Star, User, ClipboardList, Loader2, ChevronLeft, CheckCircle2 } from "lucide-react";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Partido {
  id: number;
  id_turno: number;
  club: string;
  date: string;
  court: string;
}

interface EvaluacionSheetProps {
  partido: Partido | null;
  open: boolean;
  onClose: () => void;
}

type CompanieroEstado = {
  id_usuario: string;
  nombre: string;
  evaluado: boolean;
  puntaje: number | null;
};

type EstadoEvaluacion = {
  tipo: "lobby" | "directa";
  companeros: CompanieroEstado[];
  turno: { evaluado: boolean; puntaje: number | null };
};

type Opcion = {
  key: string;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled: boolean;
  puntajeActual: number | null;
  kind: "jugador" | "turno";
  id_evaluado?: string;
};

// ─── Helpers de UI ───────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition"
        >
          <Star
            className={`size-8 transition ${
              star <= (hover || value) ? "fill-lime text-lime" : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function buildOpciones(estado: EstadoEvaluacion): Opcion[] {
  const opciones: Opcion[] = estado.companeros.map((c) => ({
    key: `jugador-${c.id_usuario}`,
    label: c.nombre,
    sublabel: "Compañero de partido",
    icon: User,
    disabled: c.evaluado,
    puntajeActual: c.puntaje,
    kind: "jugador",
    id_evaluado: c.id_usuario,
  }));

  opciones.push({
    key: "turno",
    label: "El turno",
    sublabel: "Cancha y horario",
    icon: ClipboardList,
    disabled: estado.turno.evaluado,
    puntajeActual: estado.turno.puntaje,
    kind: "turno",
  });

  return opciones;
}

// ─── Sheet ───────────────────────────────────────────────────────────────────

export function EvaluacionSheet({ partido, open, onClose }: EvaluacionSheetProps) {
  const [estado, setEstado] = useState<EstadoEvaluacion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [opcionSeleccionada, setOpcionSeleccionada] = useState<Opcion | null>(null);
  const [puntaje, setPuntaje] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !partido) {
      setEstado(null);
      setOpcionSeleccionada(null);
      setPuntaje(0);
      setEnviado(false);
      setError(null);
      return;
    }

    let cancelado = false;
    setCargando(true);
    setErrorCarga(null);

    fetch(`/api/reserva/${partido.id}/evaluaciones`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudo cargar la evaluación");
        return json as EstadoEvaluacion;
      })
      .then((data) => {
        if (!cancelado) setEstado(data);
      })
      .catch((err) => {
        if (!cancelado) setErrorCarga(err instanceof Error ? err.message : "Error de red");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [open, partido]);

  useEffect(() => {
    setPuntaje(0);
    setEnviado(false);
    setError(null);
  }, [opcionSeleccionada]);

  async function handleEnviar() {
    if (!partido || !opcionSeleccionada || puntaje === 0) return;
    setEnviando(true);
    setError(null);

    try {
      const esTurno = opcionSeleccionada.kind === "turno";
      const endpoint = esTurno ? "/api/evaluaciones/turno" : "/api/evaluaciones/jugador";
      const body = esTurno
        ? { id_turno: partido.id_turno, puntaje }
        : { id_evaluado: opcionSeleccionada.id_evaluado, id_reserva: partido.id, puntaje };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Error al enviar la evaluación");
        return;
      }

      setEnviado(true);
      // refrescamos el estado para que la opción quede deshabilitada al volver
      setEstado((prev) => {
        if (!prev) return prev;
        if (esTurno) {
          return { ...prev, turno: { evaluado: true, puntaje } };
        }
        return {
          ...prev,
          companeros: prev.companeros.map((c) =>
            c.id_usuario === opcionSeleccionada.id_evaluado ? { ...c, evaluado: true, puntaje } : c,
          ),
        };
      });
    } catch {
      setError("Error de red");
    } finally {
      setEnviando(false);
    }
  }

  if (!partido) return null;

  const opciones = estado ? buildOpciones(estado) : [];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>
            {opcionSeleccionada ? (
              <button
                onClick={() => setOpcionSeleccionada(null)}
                className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
              >
                <ChevronLeft className="size-4" /> Volver
              </button>
            ) : (
              "Evaluar partido"
            )}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {partido.club} · {partido.date} · {partido.court}
          </p>
        </SheetHeader>

        {cargando && (
          <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" /> Cargando...
          </div>
        )}

        {errorCarga && (
          <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg text-center">
            {errorCarga}
          </div>
        )}

        {/* ── Paso 1 — elegir qué evaluar ── */}
        {!cargando && !errorCarga && estado && !opcionSeleccionada && (
        <div className={opciones.length === 1 ? "flex justify-center pb-6" : "grid grid-cols-2 gap-3 pb-6"}>
          {opciones.map((op) => (
              <button
                key={op.key}
                disabled={op.disabled}
                onClick={() => !op.disabled && setOpcionSeleccionada(op)}
                className={`flex flex-col items-center gap-2 border rounded-2xl p-5 text-center transition ${
                  opciones.length === 1 ? "w-48" : ""
                } ${
                  op.disabled
                    ? "bg-muted border-border opacity-60 cursor-not-allowed"
                    : "bg-card border-border hover:border-primary hover:bg-primary/5"
                }`}
              >
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <op.icon className="size-5 text-primary" />
                </div>
                <div className="font-semibold text-sm">{op.label}</div>
                {op.disabled ? (
                  <div className="flex items-center gap-1 text-[11px] text-success font-semibold">
                    <CheckCircle2 className="size-3" /> Evaluado · {op.puntajeActual}★
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground">{op.sublabel}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Paso 2 — puntuar ── */}
        {opcionSeleccionada && (
          <div className="pb-6 space-y-6">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                <opcionSeleccionada.icon className="size-7 text-primary" />
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{opcionSeleccionada.label}</div>
                <div className="text-sm text-muted-foreground">{opcionSeleccionada.sublabel}</div>
              </div>
              <StarRating value={puntaje} onChange={setPuntaje} />
              <div className="text-sm text-muted-foreground">
                {puntaje === 0 && "Seleccioná un puntaje"}
                {puntaje === 1 && "Muy malo"}
                {puntaje === 2 && "Malo"}
                {puntaje === 3 && "Regular"}
                {puntaje === 4 && "Bueno"}
                {puntaje === 5 && "Excelente"}
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg text-center">
                {error}
              </div>
            )}

            {enviado ? (
              <div className="bg-success/15 text-success px-4 py-3 rounded-xl text-sm font-semibold text-center">
                ✓ Evaluación enviada correctamente
              </div>
            ) : (
              <Button
                className="w-full rounded-full"
                onClick={handleEnviar}
                disabled={puntaje === 0 || enviando}
              >
                {enviando ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Confirmar evaluación"
                )}
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}