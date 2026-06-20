import { NextRequest, NextResponse } from "next/server";
import { requireAccion  } from "@/lib/auth";
import { reporteService } from "@/lib/services/reporte.service";
import { routeErrorResponse } from "@/lib/http/rest-response";

export async function POST(request: NextRequest) {
  const { response } = await requireAccion("reporte.generar");
  if (response) return response;

  try {
    const semana = request.nextUrl.searchParams.get("semana");
    const reporte = await reporteService.generarReporteSemanal(semana);
    return NextResponse.json(reporte, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error, "No se pudo generar el reporte semanal", "POST /api/reportes/generar");
  }
}