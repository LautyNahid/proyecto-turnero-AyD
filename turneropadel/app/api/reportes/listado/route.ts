import { NextResponse } from "next/server";
import { requireRol } from "@/lib/auth";
import { reporteService } from "@/lib/services/reporte.service";
import { routeErrorResponse } from "@/lib/http/rest-response";

export async function GET() {
  const { response } = await requireRol("admin", "empleado");
  if (response) return response;

  try {
    const listado = await reporteService.obtenerListado();
    return NextResponse.json(listado);
  } catch (error) {
    return routeErrorResponse(error, "No se pudo obtener el listado de reportes", "GET /api/reportes/listado");
  }
}


