import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/http/rest-response";
import { climaService } from "@/lib/services/clima.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fecha = searchParams.get("fecha") ?? "";
    const hora = searchParams.get("hora") ?? "";

    const clima = await climaService.obtenerClima(fecha, hora);

    return NextResponse.json(clima);
  } catch (error) {
    return routeErrorResponse(error, "Error al consultar el clima", "[api/clima][GET]");
  }
}