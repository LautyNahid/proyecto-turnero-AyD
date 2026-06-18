import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { routeErrorResponse } from "@/lib/http/rest-response";
import { ServiceError } from "@/lib/services/service-error";
import { reservaService } from "@/lib/services/reserva.service";

type RouteContext = {
  params: Promise<{ id_usuario: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { userId, response } = await requireAuth();
    if (response) return response;

    const { id_usuario } = await context.params;

    if (id_usuario !== userId) {
      throw new ServiceError("No podes acceder al historial de otro usuario", 403);
    }

    const agenda = await reservaService.obtenerReservasPorJugador(id_usuario);

    return NextResponse.json(agenda);
  } catch (error) {
    return routeErrorResponse(error, "Error al obtener agenda", "[api/usuarios/:id/agenda][GET]");
  }
}