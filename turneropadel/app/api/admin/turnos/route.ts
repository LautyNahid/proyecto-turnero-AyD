import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/http/rest-response";
import { turnoService } from "@/lib/services/turno.service";
import { requireRol } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { response } = await requireRol("admin", "empleado");
    if (response) return response;

    const { searchParams } = new URL(req.url);
    const turnos = await turnoService.obtenerTurnosConBloqueos(searchParams);
    return NextResponse.json(turnos);
  } catch (error) {
    return routeErrorResponse(error, "Error al obtener turnos", "[api/admin/turnos][GET]");
  }
}