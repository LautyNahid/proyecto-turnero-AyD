import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/http/rest-response";
import { notificacionService } from "@/lib/services/notificacion.service";
import { requireAuth } from "@/lib/auth";

export async function GET(_req: Request) {
  try {
    const { userId, response } = await requireAuth();
    if (response) return response;

    const notificaciones = await notificacionService.listarPorUsuario(userId);

    return NextResponse.json({ data: notificaciones, error: null });
  } catch (error) {
    return routeErrorResponse(error, "Error al listar notificaciones", "[api/notificaciones][GET]");
  }
}