"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Star, User, Users, ClipboardList, Loader2, ChevronLeft } from "lucide-react";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type OpcionEvaluacion = "companero" | "contrincante1" | "contrincante2" | "turno";

interface Partido {
  id: number;
  club: string;
  date: string;
  court: string;
}

interface EvaluacionSheetProps {
  partido: Partido | null;
  open: boolean;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const OPCIONES: { key: OpcionEvaluacion; label: string; sublabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "companero", label: "Tu compañero", sublabel: "Jugador de tu lado", icon: User },
  { key: "contrincante1", label: "Contrincante 1", sublabel: "Jugador del equipo rival", icon: Users },
  { key: "contrincante2", label: "Contrincante 2", sublabel: "Jugador del equipo rival", icon: Users },
  { key: "turno", label: "El turno", sublabel: "Evaluá la cancha y el horario", icon: ClipboardList },
];

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
              star <= (hover || value)
                ? "fill-lime text-lime"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Sheet ───────────────────────────────────────────────────────────────────

export function EvaluacionSheet({ partido, open, onClose }: EvaluacionSheetProps) {
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<OpcionEvaluacion | null>(null);
  const [puntaje, setPuntaje] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      setOpcionSeleccionada(null);
      setPuntaje(0);
      setEnviando(false);
      setEnviado(false);
      setError(null);
    }
  }, [open]);

  // Reset puntaje al cambiar opción
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
      const esTurno = opcionSeleccionada === "turno";
      const endpoint = esTurno
        ? "/api/evaluaciones/turno"
        : "/api/evaluaciones/jugador";

      const body = esTurno
        ? { id_turno: partido.id, puntaje }
        : { id_reserva: partido.id, tipo: opcionSeleccionada, puntaje };

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
    } catch {
      setError("Error de red");
    } finally {
      setEnviando(false);
    }
  }

  if (!partido) return null;

  const opcionActual = OPCIONES.find((o) => o.key === opcionSeleccionada);

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

        {/* ── Paso 1 — elegir qué evaluar ── */}
        {!opcionSeleccionada && (
          <div className="grid grid-cols-2 gap-3 pb-6">
            {OPCIONES.map((op) => (
              <button
                key={op.key}
                onClick={() => setOpcionSeleccionada(op.key)}
                className="flex flex-col items-center gap-2 bg-card border border-border rounded-2xl p-5 hover:border-primary hover:bg-primary/5 transition text-center"
              >
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <op.icon className="size-5 text-primary" />
                </div>
                <div className="font-semibold text-sm">{op.label}</div>
                <div className="text-[11px] text-muted-foreground">{op.sublabel}</div>
              </button>
            ))}
          </div>
        )}

        {/* ── Paso 2 — puntuar ── */}
        {opcionSeleccionada && opcionActual && (
          <div className="pb-6 space-y-6">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                <opcionActual.icon className="size-7 text-primary" />
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{opcionActual.label}</div>
                <div className="text-sm text-muted-foreground">{opcionActual.sublabel}</div>
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