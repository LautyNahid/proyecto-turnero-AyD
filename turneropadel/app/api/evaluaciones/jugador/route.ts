import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/http/rest-response";
import { evaluacionService } from "@/lib/services/evaluacion.service";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { userId, response } = await requireAuth();
    if (response) return response;

    const body = await req.json();
    const evaluacion = await evaluacionService.evaluarJugador(body, userId);

    return NextResponse.json({ data: evaluacion, error: null }, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error, "Error al evaluar jugador", "[api/evaluaciones/jugador][POST]");
  }
}