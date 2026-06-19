import { NextRequest, NextResponse } from "next/server";
import { requireRol } from "@/lib/auth";
import { fail } from "@/lib/types";
import * as lobbyService from "@/lib/services/lobby.service";
import { emitir } from "@/lib/events";

type RouteContext = { params: Promise<{ id: string; solicitudId: string }> };

const ACCIONES_VALIDAS = ["aceptar", "rechazar"] as const;
type Accion = (typeof ACCIONES_VALIDAS)[number];

const ERRORES_422 = [
  "El lobby ya no está abierto",
  "La solicitud ya no se encuentra disponible",
  "El partido ya está completo",
  "Solicitud no pertenece a este lobby",
];

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { userId, response } = await requireRol("jugador", "admin");
  if (response) return response;

  const { id, solicitudId } = await params;
  const id_lobby = Number(id);
  const id_solicitud = Number(solicitudId);

  if (isNaN(id_lobby) || isNaN(id_solicitud)) {
    return NextResponse.json(fail("IDs inválidos"), { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json(fail("Body inválido"), { status: 400 });

  const { accion } = body as { accion?: unknown };

  if (typeof accion !== "string" || !ACCIONES_VALIDAS.includes(accion as Accion)) {
    return NextResponse.json(
      fail(`accion debe ser: ${ACCIONES_VALIDAS.join(" | ")}`),
      { status: 400 }
    );
  }

  const result = await lobbyService.responderSolicitud({
    id_solicitud,
    id_lobby,
    accion: accion as Accion,
    id_organizador: userId!,
  });

  if (result.error) {
    const status = result.error === "Lobby no encontrado" ? 404
      : result.error === "Solicitud no encontrada" ? 404
      : result.error === "Sin permisos" ? 403
      : ERRORES_422.includes(result.error) ? 422
      : 500;
    return NextResponse.json(result, { status });
  }

  const { solicitud } = result.data!;

  if (accion === "aceptar") {
    emitir("solicitud.aceptada", {
      id_lobby,
      id_jugador: solicitud.id_jugador,
    });
  }

  if (accion === "rechazar") {
    emitir("solicitud.rechazada", {
      id_lobby,
      id_jugador: solicitud.id_jugador,
    });
  }

  return NextResponse.json(result);
}