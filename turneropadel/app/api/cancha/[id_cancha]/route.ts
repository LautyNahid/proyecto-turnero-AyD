import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/http/rest-response";
import { canchaService } from "@/lib/services/cancha.service";
import { requireRol } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id_cancha: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id_cancha } = await context.params;
    const cancha = await canchaService.obtenerCanchaPorId(id_cancha);

    return NextResponse.json(cancha);
  } catch (error) {
    return routeErrorResponse(error, "Error al obtener cancha", "[api/canchas/:id][GET]");
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { userId, response } = await requireRol("admin");
    if (response) return response;
  
    const { id_cancha } = await context.params;
    const body = await req.json();
    const cancha = await canchaService.modificarCancha(id_cancha, body);

    return NextResponse.json(cancha);
  } catch (error) {
    return routeErrorResponse(error, "Error al modificar cancha", "[api/canchas/:id][PATCH]");
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { userId, response } = await requireRol("admin");
    if (response) return response;

    const { id_cancha } = await context.params;
    await canchaService.eliminarCancha(id_cancha);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return routeErrorResponse(error, "Error al eliminar cancha", "[api/canchas/:id][DELETE]");
  }
}
