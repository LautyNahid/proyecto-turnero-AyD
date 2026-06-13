import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/http/rest-response";
import { turnoService } from "@/lib/services/turno.service";

type RouteContext = {
  params: Promise<{ id_turno: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id_turno } = await context.params;
    const turno = await turnoService.obtenerTurnoPorId(id_turno);

    return NextResponse.json(turno);
  } catch (error) {
    return routeErrorResponse(error, "Error al obtener turno", "[api/turno/:id][GET]");
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id_turno } = await context.params;
    const body = await req.json();
    const turno = await turnoService.modificarTurno(id_turno, body);

    return NextResponse.json(turno);
  } catch (error) {
    return routeErrorResponse(error, "Error al modificar turno", "[api/turno/:id][PATCH]");
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id_turno } = await context.params;
    await turnoService.eliminarTurno(id_turno);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return routeErrorResponse(error, "Error al eliminar turno", "[api/turno/:id][DELETE]");
  }
}
