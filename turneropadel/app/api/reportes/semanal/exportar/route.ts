import { NextRequest, NextResponse } from "next/server";
import { requireRol } from "@/lib/auth";
import { reporteService } from "@/lib/services/reporte.service";
import type { ReporteDatos } from "@/lib/services/reporte.service";
import { generarExcelReporteSemanal } from "@/lib/reportes/excel";
import { generarPdfReporteSemanal } from "@/lib/reportes/pdf";
import { ServiceError } from "@/lib/services/service-error";
import { routeErrorResponse } from "@/lib/http/rest-response";

function parseFormato(value: string | null): "excel" | "pdf" {
  if (value !== "excel" && value !== "pdf") {
    throw new ServiceError("El parámetro 'formato' debe ser 'excel' o 'pdf'");
  }
  return value;
}

export async function GET(request: NextRequest) {
  const { response } = await requireRol("admin", "empleado");
  if (response) return response;

  try {
    const semana = request.nextUrl.searchParams.get("semana");
    const formato = parseFormato(request.nextUrl.searchParams.get("formato"));

    const reporte = await reporteService.obtenerReporteSemanal(semana);
    const datos = reporte.datos_json as unknown as ReporteDatos;

    const nombreBase = `reporte-semanal_${datos.periodo.inicio}_${datos.periodo.fin}`;

    if (formato === "excel") {
      const buffer = await generarExcelReporteSemanal(datos);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${nombreBase}.xlsx"`,
        },
      });
    }

    const buffer = await generarPdfReporteSemanal(datos);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreBase}.pdf"`,
      },
    });
  } catch (error) {
    return routeErrorResponse(error, "No se pudo exportar el reporte semanal", "GET /api/reportes/semanal/exportar");
  }
}