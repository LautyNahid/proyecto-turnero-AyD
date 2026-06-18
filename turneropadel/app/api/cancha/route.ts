import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/http/rest-response";
import { canchaService } from "@/lib/services/cancha.service";
import { requireRol } from "@/lib/auth";

export async function GET() {
  try {
    const canchas = await canchaService.obtenerCanchas();
    return NextResponse.json(canchas);
  } catch (error) {
    return routeErrorResponse(error, "Error al obtener canchas", "[api/canchas][GET]");
  }
}

export async function POST(req: Request) {
  try {
    const { userId, response } = await requireRol("admin");
    if (response) return response;
    
    const body = await req.json();
    const cancha = await canchaService.crearCancha(body);
    const location = new URL(`/api/canchas/${cancha.id_cancha}`, req.url);

    return NextResponse.json(cancha, {
      status: 201,
      headers: { Location: location.toString() },
    });
  } catch (error) {
    return routeErrorResponse(error, "Error al crear cancha", "[api/canchas][POST]");
  }
}
