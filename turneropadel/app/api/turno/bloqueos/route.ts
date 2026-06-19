import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/http/rest-response";
import { bloqueoService } from "@/lib/services/bloqueo.service";
import { requireRol } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { response } = await requireRol("admin");
    if (response) return response;

    const body = await req.json();
    const bloqueo = await bloqueoService.bloquearPorHorario(body);

    return NextResponse.json(bloqueo, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error, "Error al bloquear horario", "[api/turnos/bloqueos][POST]");
  }
}