"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type FinalizarTurnosResponse = {
  finalizados: number;
  lobbiesFinalizados?: number;
  ids?: number[];
  error?: string;
};

export function FinalizarTurnosJobButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FinalizarTurnosResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function finalizarTurnos() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/jobs/finalizar-turnos", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudieron finalizar los turnos vencidos");
        return;
      }

      setResult(data);
    } catch {
      setError("Error de red al finalizar turnos vencidos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-bold">Finalizar turnos vencidos</div>
          <div className="text-xs text-muted-foreground">
            Marca como finalizados los turnos reservados o en curso que ya superaron sus 90 minutos.
          </div>
        </div>

        <Button type="button" onClick={() => void finalizarTurnos()} disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCcw className="size-4" />
          )}
          Ejecutar ahora
        </Button>
      </div>

      {result && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs font-semibold text-success">
          <CheckCircle2 className="size-4" />
          Turnos finalizados: {result.finalizados}. Lobbies finalizados: {result.lobbiesFinalizados ?? 0}.
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          <AlertTriangle className="size-4" />
          {error}
        </div>
      )}
    </section>
  );
}
