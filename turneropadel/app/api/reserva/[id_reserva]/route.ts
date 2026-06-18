import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/http/rest-response";
import { reservaService } from "@/lib/services/reserva.service";
import { requireAuth, getRolUsuario } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id_reserva: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id_reserva } = await context.params;
    const reserva = await reservaService.obtenerReservaPorId(id_reserva);

    return NextResponse.json(reserva);
  } catch (error) {
    return routeErrorResponse(error, "Error al obtener reserva", "[api/reserva/:id][GET]");
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { userId, response } = await requireAuth();
    if (response) return response;

    const rol = await getRolUsuario(userId!);
    const esAdmin = rol === "admin";

    const { id_reserva } = await context.params;
    await reservaService.eliminarReserva(id_reserva, userId!, esAdmin);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return routeErrorResponse(error, "Error al eliminar reserva", "[api/reserva/:id][DELETE]");
  }
}