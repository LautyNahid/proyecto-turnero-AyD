import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/http/rest-response";
import { notificacionService } from "@/lib/services/notificacion.service";
import { requireAuth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_req: Request, context: RouteContext) {
  try {
    const { userId, response } = await requireAuth();
    if (response) return response;

    const { id } = await context.params;

    const notificacion = await notificacionService.marcarComoLeida(id, userId);

    return NextResponse.json({ data: notificacion, error: null });
  } catch (error) {
    return routeErrorResponse(error, "Error al marcar notificación como leída", "[api/notificaciones/:id][PATCH]");
  }
}