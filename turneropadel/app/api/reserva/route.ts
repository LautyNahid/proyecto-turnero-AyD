import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { routeErrorResponse } from "@/lib/http/rest-response";
import { reservaService } from "@/lib/services/reserva.service";

export async function GET() {
  try {
    const reservas = await reservaService.obtenerReservas();
    return NextResponse.json(reservas);
  } catch (error) {
    return routeErrorResponse(error, "Error al obtener reservas", "[api/reserva][GET]");
  }
}

export async function POST(req: Request) {
  try {
    const { userId, response } = await requireAuth();
    if (response) return response;

    const body = await req.json();
    const reserva = await reservaService.crearReserva(body, userId);
    const location = new URL(`/api/reserva/${reserva.id_reserva}`, req.url);

    return NextResponse.json(reserva, {
      status: 201,
      headers: { Location: location.toString() },
    });
  } catch (error) {
    return routeErrorResponse(error, "Error al crear reserva", "[api/reserva][POST]");
  }
}
