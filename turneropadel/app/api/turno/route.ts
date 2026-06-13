import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/http/rest-response";
import { turnoService } from "@/lib/services/turno.service";

export async function GET() {
  try {
    const turnos = await turnoService.obtenerTurnos();
    return NextResponse.json(turnos);
  } catch (error) {
    return routeErrorResponse(error, "Error al obtener turnos", "[api/turno][GET]");
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const turno = await turnoService.crearTurno(body);
    const location = new URL(`/api/turno/${turno.id_turno}`, req.url);

    return NextResponse.json(turno, {
      status: 201,
      headers: { Location: location.toString() },
    });
  } catch (error) {
    return routeErrorResponse(error, "Error al crear turno", "[api/turno][POST]");
  }
}
