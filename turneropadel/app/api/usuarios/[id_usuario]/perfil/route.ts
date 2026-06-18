import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { routeErrorResponse } from "@/lib/http/rest-response";
import { usuarioService } from "@/lib/services/usuario.service";

type RouteContext = {
  params: Promise<{ id_usuario: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { userId, response } = await requireAuth();
    if (response) return response;

    const { id_usuario } = await context.params;
    const perfil = await usuarioService.obtenerPerfil(id_usuario, userId!);

    return NextResponse.json(perfil);
  } catch (error) {
    return routeErrorResponse(error, "Error al obtener perfil", "[api/usuarios/:id/perfil][GET]");
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { userId, response } = await requireAuth();
    if (response) return response;

    const { id_usuario } = await context.params;
    const body = await req.json();
    const perfil = await usuarioService.editarPerfil(id_usuario, userId!, body);

    return NextResponse.json(perfil);
  } catch (error) {
    return routeErrorResponse(error, "Error al editar perfil", "[api/usuarios/:id/perfil][PATCH]");
  }
}