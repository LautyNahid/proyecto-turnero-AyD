"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FileSpreadsheet, FileText, RefreshCw, AlertCircle } from "lucide-react";

type ReporteCancha = {
  id_cancha: number;
  nro_cancha: number;
  total_reservas: number;
  ingresos: number;
  hora_pico: string | null;
};

type ReporteJugador = {
  id_jugador: string;
  partidos_jugados: number;
  promedio_puntaje: number;
  penalizaciones: number;
};

type ReporteDatos = {
  periodo: { inicio: string; fin: string };
  canchas: ReporteCancha[];
  jugadores: ReporteJugador[];
  metricas_globales: {
    total_ingresos: number;
    cancha_mas_demandada: number | null;
    hora_pico_global: string | null;
    porcentaje_cancelaciones: number;
  };
};

type ReporteSemanalResponse = {
  id_reporte: number;
  periodo_inicio: string;
  periodo_fin: string;
  datos_json: ReporteDatos;
  generado_en: string;
};

type ReporteResumen = {
  id_reporte: number;
  periodo_inicio: string;
  periodo_fin: string;
  generado_en: string;
};

// El backend exige que "semana" sea un lunes. Para no pelear con el usuario
// en el input, cualquier fecha elegida se "clampea" al lunes de esa semana.
function mondayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dia = date.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  date.setDate(date.getDate() + diff);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function lunesActual(): string {
  return mondayOf(new Date().toISOString().slice(0, 10));
}

export default function Reportes() {
  const [semana, setSemana] = useState(lunesActual());
  const [reporte, setReporte] = useState<ReporteSemanalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [exportando, setExportando] = useState<"excel" | "pdf" | null>(null);
  const [listado, setListado] = useState<ReporteResumen[]>([]);

  const cargarListado = useCallback(async () => {
    try {
      const res = await fetch("/api/reportes/listado");
      if (!res.ok) return;
      const data = (await res.json()) as ReporteResumen[];
      setListado(data);
    } catch {
      // listado es complementario; si falla, no rompemos la pantalla principal
    }
  }, []);

  const cargarReporte = useCallback(async (semanaParam: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reportes/semanal?semana=${semanaParam}`);
      if (res.status === 404) {
        setReporte(null);
        setError("Sin datos disponibles para esta semana");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "No se pudo obtener el reporte");
      }
      const data = (await res.json()) as ReporteSemanalResponse;
      setReporte(data);
    } catch (e) {
      setReporte(null);
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarReporte(semana);
  }, [semana, cargarReporte]);

  useEffect(() => {
    cargarListado();
  }, [cargarListado]);

  async function handleGenerar() {
    setGenerando(true);
    setError(null);
    try {
      const res = await fetch(`/api/reportes/generar?semana=${semana}`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "No se pudo generar el reporte");
      }
      await cargarReporte(semana);
      await cargarListado();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setGenerando(false);
    }
  }

  async function handleExportar(formato: "excel" | "pdf") {
    setExportando(formato);
    setError(null);
    try {
      const res = await fetch(`/api/reportes/semanal/exportar?semana=${semana}&formato=${formato}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "No se pudo exportar el reporte");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-semanal_${semana}.${formato === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al exportar");
    } finally {
      setExportando(null);
    }
  }

  const datos = reporte?.datos_json;

  return (
    <AppShell title="Reportes" subtitle="Indicadores clave del complejo">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="semana" className="text-sm font-semibold text-muted-foreground">
              Semana
            </label>
            <input
              id="semana"
              type="date"
              value={semana}
              onChange={(e) => e.target.value && setSemana(mondayOf(e.target.value))}
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm"
            />
          </div>

          {listado.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="reportes-generados" className="text-sm font-semibold text-muted-foreground">
                Reportes generados
              </label>
              <select
                id="reportes-generados"
                value={semana}
                onChange={(e) => e.target.value && setSemana(e.target.value)}
                className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm max-w-[220px]"
              >
                <option value="" disabled>
                  Elegir...
                </option>
                {listado.map((r) => (
                  <option key={r.id_reporte} value={r.periodo_inicio.slice(0, 10)}>
                    {r.periodo_inicio.slice(0, 10)} al {r.periodo_fin.slice(0, 10)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerar}
            disabled={generando}
            className="inline-flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-secondary disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${generando ? "animate-spin" : ""}`} />
            {generando ? "Generando..." : "Generar reporte"}
          </button>
          <button
            onClick={() => handleExportar("excel")}
            disabled={!datos || exportando !== null}
            className="inline-flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-secondary disabled:opacity-50"
          >
            <FileSpreadsheet className="size-3.5" />
            {exportando === "excel" ? "Exportando..." : "Exportar Excel"}
          </button>
          <button
            onClick={() => handleExportar("pdf")}
            disabled={!datos || exportando !== null}
            className="inline-flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-secondary disabled:opacity-50"
          >
            <FileText className="size-3.5" />
            {exportando === "pdf" ? "Exportando..." : "Exportar PDF"}
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Cargando reporte...</div>}

      {!loading && error && (
        <div className="flex items-center gap-2 bg-card border border-border rounded-2xl p-5 shadow-soft text-sm text-muted-foreground mb-6">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {!loading && datos && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Metric title="Ingresos del período" value={`$${datos.metricas_globales.total_ingresos.toLocaleString()}`} />
            <Metric
              title="Cancha más demandada"
              value={
                datos.metricas_globales.cancha_mas_demandada
                  ? `Cancha ${
                      datos.canchas.find((c) => c.id_cancha === datos.metricas_globales.cancha_mas_demandada)
                        ?.nro_cancha ?? datos.metricas_globales.cancha_mas_demandada
                    }`
                  : "N/A"
              }
            />
            <Metric title="Hora pico global" value={datos.metricas_globales.hora_pico_global ?? "N/A"} />
            <Metric title="% Cancelaciones" value={`${datos.metricas_globales.porcentaje_cancelaciones}%`} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Por cancha" subtitle={`${datos.periodo.inicio} al ${datos.periodo.fin}`}>
              <div className="space-y-4 mt-4">
                {datos.canchas.length === 0 && (
                  <div className="text-sm text-muted-foreground">Sin reservas en el período</div>
                )}
                {datos.canchas.map((c) => (
                  <div key={c.id_cancha} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-0.5">
                    <span className="font-semibold">Cancha {c.nro_cancha}</span>
                    <span className="text-muted-foreground">
                      {c.total_reservas} reservas · ${c.ingresos.toLocaleString()} · pico {c.hora_pico ?? "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Por jugador" subtitle="Actividad del período">
              <div className="space-y-3 mt-4 text-sm max-h-72 overflow-y-auto">
                {datos.jugadores.length === 0 && (
                  <div className="text-sm text-muted-foreground">Sin actividad de jugadores en el período</div>
                )}
                {datos.jugadores.map((j) => (
                  <div key={j.id_jugador} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                    <span className="font-semibold truncate">{j.id_jugador}</span>
                    <span className="text-muted-foreground text-xs">
                      {j.partidos_jugados} partidos · prom {j.promedio_puntaje} · {j.penalizaciones} penal.
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{title}</div>
      <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">{value}</div>
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