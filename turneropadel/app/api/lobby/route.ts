import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRol } from "@/lib/auth";
import { fail } from "@/lib/types";
import * as lobbyService from "@/lib/services/lobby.service";

export async function GET(req: NextRequest) {
  const { userId, response } = await requireAuth();
  if (response) return response;

  const todos = req.nextUrl.searchParams.get("todos") === "true";

  const result = todos
    ? await lobbyService.listarLobbies(true)
    : await lobbyService.listarLobbiesDelJugador(userId!);

  if (result.error) return NextResponse.json(result, { status: 500 });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { userId, response } = await requireRol("jugador");
  if (response) return response;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json(fail("Body inválido"), { status: 400 });

  const { id_turno, jugadores_faltantes } = body as {
    id_turno?: unknown;
    jugadores_faltantes?: unknown;
  };

  if (typeof id_turno !== "number" || typeof jugadores_faltantes !== "number") {
    return NextResponse.json(fail("id_turno y jugadores_faltantes son requeridos"), {
      status: 400,
    });
  }

  const result = await lobbyService.crearLobby({
    id_turno,
    id_creador: userId!,
    jugadores_faltantes,
  });

  if (result.error) {
    const esValidacion = [
      "jugadores_faltantes debe ser entre 1 y 3",
      "El turno no está disponible",
      "El turno ya tiene un lobby asociado",
      "Turno no encontrado",
    ].includes(result.error);

    return NextResponse.json(result, { status: esValidacion ? 422 : 500 });
  }

  return NextResponse.json(result, { status: 201 });
}