import PDFDocument from "pdfkit";
import type { ReporteDatos } from "@/lib/services/reporte.service";

export function generarPdfReporteSemanal(datos: ReporteDatos): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Reporte Semanal — SalePadel", { align: "center" });
    doc.moveDown();
    doc.fontSize(11).text(`Período: ${datos.periodo.inicio} al ${datos.periodo.fin}`);
    doc.moveDown();

    doc.fontSize(14).text("Métricas globales");
    doc.fontSize(11);
    doc.text(`Total ingresos: ${datos.metricas_globales.total_ingresos}`);
    doc.text(`Cancha más demandada (id): ${datos.metricas_globales.cancha_mas_demandada ?? "N/A"}`);
    doc.text(`Hora pico global: ${datos.metricas_globales.hora_pico_global ?? "N/A"}`);
    doc.text(`% Cancelaciones: ${datos.metricas_globales.porcentaje_cancelaciones}%`);
    doc.moveDown();

    doc.fontSize(14).text("Canchas");
    doc.fontSize(10);
    for (const c of datos.canchas) {
      doc.text(
        `Cancha ${c.nro_cancha} — Reservas: ${c.total_reservas} | Ingresos: ${c.ingresos} | Hora pico: ${c.hora_pico ?? "N/A"}`,
      );
    }
    doc.moveDown();

    doc.fontSize(14).text("Jugadores");
    doc.fontSize(10);
    for (const j of datos.jugadores) {
      doc.text(
        `${j.id_jugador} — Partidos: ${j.partidos_jugados} | Promedio: ${j.promedio_puntaje} | Penalizaciones: ${j.penalizaciones}`,
      );
    }

    doc.end();
  });
}