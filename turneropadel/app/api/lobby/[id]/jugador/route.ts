import { NextRequest, NextResponse } from "next/server";
import { requireRol } from "@/lib/auth";
import { fail } from "@/lib/types";
import * as lobbyService from "@/lib/services/lobby.service";

type RouteContext = { params: Promise<{ id: string }> };

const ERRORES_403 = ["Sin permisos"];
const ERRORES_404 = ["Lobby no encontrado", "El jugador no está en este lobby"];
const ERRORES_422 = [
  "No se puede expulsar jugadores de un lobby finalizado o cancelado",
  "El organizador no puede expulsarse a sí mismo",
];

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { userId, response } = await requireRol("jugador", "admin");
  if (response) return response;

  const { id } = await params;
  const id_lobby = Number(id);
  if (isNaN(id_lobby)) {
    return NextResponse.json(fail("ID inválido"), { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json(fail("Body inválido"), { status: 400 });

  const { id_jugador } = body as { id_jugador?: unknown };

  if (typeof id_jugador !== "string" || id_jugador.trim() === "") {
    return NextResponse.json(fail("id_jugador es requerido"), { status: 400 });
  }

  const result = await lobbyService.expulsarJugador({
    id_lobby,
    id_jugador,
    id_organizador: userId!,
  });

  if (result.error) {
    const status = ERRORES_403.includes(result.error) ? 403
      : ERRORES_404.includes(result.error) ? 404
      : ERRORES_422.includes(result.error) ? 422
      : 500;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}