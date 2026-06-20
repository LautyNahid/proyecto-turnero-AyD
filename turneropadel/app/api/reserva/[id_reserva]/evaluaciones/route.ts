import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/http/rest-response";
import { evaluacionService } from "@/lib/services/evaluacion.service";
import { requireAuth } from "@/lib/auth";

type RouteContext = { params: Promise<{ id_reserva: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { userId, response } = await requireAuth();
    if (response) return response;

    const { id_reserva } = await params;
    const estado = await evaluacionService.obtenerEstadoEvaluacion(id_reserva, userId);

    return NextResponse.json(estado);
  } catch (error) {
    return routeErrorResponse(error, "Error al obtener estado de evaluación", "[api/reserva/:id/evaluaciones][GET]");
  }
}