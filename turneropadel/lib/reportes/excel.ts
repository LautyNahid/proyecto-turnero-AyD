import ExcelJS from "exceljs";
import type { ReporteDatos } from "@/lib/services/reporte.service";

export async function generarExcelReporteSemanal(datos: ReporteDatos): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SalePadel";
  workbook.created = new Date();

  const canchaDemandada = datos.canchas.find(
    (c) => c.id_cancha === datos.metricas_globales.cancha_mas_demandada,
  );

  // ── Hoja Resumen ──────────────────────────────────────────────────────────
  const resumen = workbook.addWorksheet("Resumen");
  resumen.columns = [
    { header: "Métrica", key: "metrica", width: 30 },
    { header: "Valor", key: "valor", width: 20 },
  ];
  resumen.addRows([
    { metrica: "Período inicio", valor: datos.periodo.inicio },
    { metrica: "Período fin", valor: datos.periodo.fin },
    { metrica: "Total ingresos", valor: datos.metricas_globales.total_ingresos },
    { metrica: "Cancha más demandada", valor: canchaDemandada ? `Cancha ${canchaDemandada.nro_cancha}` : "N/A" },
    { metrica: "Hora pico global", valor: datos.metricas_globales.hora_pico_global ?? "N/A" },
    { metrica: "% Cancelaciones", valor: datos.metricas_globales.porcentaje_cancelaciones },
  ]);
  resumen.getRow(1).font = { bold: true };

  // ── Hoja Canchas ──────────────────────────────────────────────────────────
  const canchas = workbook.addWorksheet("Canchas");
  canchas.columns = [
    { header: "Nro. Cancha", key: "nro_cancha", width: 15 },
    { header: "Total reservas", key: "total_reservas", width: 18 },
    { header: "Ingresos", key: "ingresos", width: 15 },
    { header: "Hora pico", key: "hora_pico", width: 15 },
  ];
  canchas.addRows(
    datos.canchas.map((c) => ({
      nro_cancha: c.nro_cancha,
      total_reservas: c.total_reservas,
      ingresos: c.ingresos,
      hora_pico: c.hora_pico ?? "N/A",
    })),
  );
  canchas.getRow(1).font = { bold: true };

  // ── Hoja Jugadores ────────────────────────────────────────────────────────
  const jugadores = workbook.addWorksheet("Jugadores");
  jugadores.columns = [
    { header: "ID Jugador", key: "id_jugador", width: 30 },
    { header: "Partidos jugados", key: "partidos_jugados", width: 18 },
    { header: "Promedio puntaje", key: "promedio_puntaje", width: 18 },
    { header: "Penalizaciones", key: "penalizaciones", width: 16 },
  ];
  jugadores.addRows(datos.jugadores);
  jugadores.getRow(1).font = { bold: true };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}