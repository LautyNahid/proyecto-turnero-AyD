import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/http/rest-response";
import { canchaService } from "@/lib/services/cancha.service";

type RouteContext = {
  params: Promise<{ id_cancha: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id_cancha } = await context.params;
    const ubicacion = await canchaService.obtenerUbicacion(id_cancha);

    return NextResponse.json(ubicacion);
  } catch (error) {
    return routeErrorResponse(error, "Error al obtener ubicacion", "[api/canchas/:id/ubicacion][GET]");
  }
}