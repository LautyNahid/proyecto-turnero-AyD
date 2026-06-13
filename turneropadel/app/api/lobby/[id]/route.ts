import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRol } from "@/lib/auth";
import { fail } from "@/lib/types";
import * as lobbyService from "@/lib/services/lobby.service";
import type { EstadoLobby } from "@prisma/client";

const ESTADOS_VALIDOS: EstadoLobby[] = ["Abierto", "Confirmado", "Finalizado", "Cancelado"];

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { response } = await requireAuth();
  if (response) return response;

  const { id } = await params;
  const id_lobby = Number(id);
  if (isNaN(id_lobby)) {
    return NextResponse.json(fail("ID inválido"), { status: 400 });
  }

  const result = await lobbyService.obtenerLobby(id_lobby);

  if (result.error) {
    const status = result.error === "Lobby no encontrado" ? 404 : 500;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { userId, response } = await requireRol("jugador", "admin");
  if (response) return response;

  const { id } = await params;
  const id_lobby = Number(id);
  if (isNaN(id_lobby)) {
    return NextResponse.json(fail("ID inválido"), { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json(fail("Body inválido"), { status: 400 });

  const { estado_lobby } = body as { estado_lobby?: unknown };

  if (typeof estado_lobby !== "string" || !ESTADOS_VALIDOS.includes(estado_lobby as EstadoLobby)) {
    return NextResponse.json(
      fail(`estado_lobby debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`),
      { status: 400 }
    );
  }

  const result = await lobbyService.actualizarEstadoLobby({
    id_lobby,
    estado_lobby: estado_lobby as EstadoLobby,
    id_solicitante: userId!,
  });

  if (result.error) {
    const status = result.error === "Lobby no encontrado" ? 404
      : result.error === "Sin permisos" ? 403
      : 500;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}