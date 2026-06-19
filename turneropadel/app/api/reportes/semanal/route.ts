import { NextRequest, NextResponse } from "next/server";
import { requireRol } from "@/lib/auth";
import { reporteService } from "@/lib/services/reporte.service";
import { routeErrorResponse } from "@/lib/http/rest-response";

export async function GET(request: NextRequest) {
  const { response } = await requireRol("admin", "empleado");
  if (response) return response;

  try {
    const semana = request.nextUrl.searchParams.get("semana");
    const reporte = await reporteService.obtenerReporteSemanal(semana);
    return NextResponse.json(reporte);
  } catch (error) {
    return routeErrorResponse(error, "No se pudo obtener el reporte semanal", "GET /api/reportes/semanal");
  }
}