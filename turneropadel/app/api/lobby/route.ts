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

  const { id_turno, jugadores_faltantes, id_cancha, fecha, hora, precio } = body;

  if (typeof jugadores_faltantes !== "number") {
    return NextResponse.json(fail("jugadores_faltantes es requerido"), {
      status: 400,
    });
  }

  if (typeof id_turno !== "number" && (typeof id_cancha !== "number" || !fecha || !hora)) {
    return NextResponse.json(fail("id_turno o los datos del turno (id_cancha, fecha, hora) son requeridos"), {
      status: 400,
    });
  }

  const result = await lobbyService.crearLobby({
    id_turno: typeof id_turno === "number" ? id_turno : undefined,
    id_creador: userId!,
    jugadores_faltantes,
    id_cancha: typeof id_cancha === "number" ? id_cancha : undefined,
    fecha: typeof fecha === "string" ? fecha : undefined,
    hora: typeof hora === "string" ? hora : undefined,
    precio: typeof precio === "number" ? precio : undefined,
  });

  if (result.error) {
    const esValidacion = [
      "jugadores_faltantes debe ser entre 1 y 3",
      "El turno no está disponible",
      "El turno ya tiene un lobby asociado",
      "Turno no encontrado",
      "Faltan datos para identificar o crear el turno",
      "Fecha inválida",
    ].includes(result.error);

    return NextResponse.json(result, { status: esValidacion ? 422 : 500 });
  }

  return NextResponse.json(result, { status: 201 });
}