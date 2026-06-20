import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/http/rest-response";
import { bloqueoService } from "@/lib/services/bloqueo.service";
import { requireAccion  } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id_turno: string }>;
};

export async function POST(req: Request, context: RouteContext) {
  try {
    const { response } = await requireAccion("turno.bloquear");
    if (response) return response;

    const { id_turno } = await context.params;
    const body = await req.json();
    const bloqueo = await bloqueoService.bloquearTurno(id_turno, body);

    return NextResponse.json(bloqueo, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error, "Error al bloquear turno", "[api/turnos/:id/bloqueos][POST]");
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { response } = await requireAccion("turno.bloquear");
    if (response) return response;

    const { id_turno } = await context.params;
    await bloqueoService.desbloquearTurno(id_turno);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return routeErrorResponse(error, "Error al desbloquear turno", "[api/turnos/:id/bloqueos][DELETE]");
  }
}