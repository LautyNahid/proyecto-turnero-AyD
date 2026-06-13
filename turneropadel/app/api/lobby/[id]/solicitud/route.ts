import { NextRequest, NextResponse } from "next/server";
import { requireRol } from "@/lib/auth";
import { fail } from "@/lib/types";
import * as lobbyService from "@/lib/services/lobby.service";

type RouteContext = { params: Promise<{ id: string }> };

const ERRORES_422 = [
  "El lobby no está abierto",
  "Ya no hay cupos disponibles en este partido",
  "El organizador no puede solicitar ingreso a su propio lobby",
  "Ya estás inscripto en este lobby",
  "Ya tenés una solicitud pendiente para este lobby",
];

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { userId, response } = await requireRol("jugador", "admin");
  if (response) return response;

  const { id } = await params;
  const id_lobby = Number(id);
  if (isNaN(id_lobby)) {
    return NextResponse.json(fail("ID inválido"), { status: 400 });
  }

  const result = await lobbyService.listarSolicitudes(id_lobby, userId!);

  if (result.error) {
    const status = result.error === "Lobby no encontrado" ? 404
      : result.error === "Sin permisos" ? 403
      : 500;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const { userId, response } = await requireRol("jugador");
  if (response) return response;

  const { id } = await params;
  const id_lobby = Number(id);
  if (isNaN(id_lobby)) {
    return NextResponse.json(fail("ID inválido"), { status: 400 });
  }

  const result = await lobbyService.crearSolicitud(id_lobby, userId!);

  if (result.error) {
    const status = result.error === "Lobby no encontrado" ? 404
      : ERRORES_422.includes(result.error) ? 422
      : 500;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, { status: 201 });
}