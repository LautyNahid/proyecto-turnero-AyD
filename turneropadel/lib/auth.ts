import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fail } from "@/lib/types";
import type { Rol } from "@/lib/types";

export async function getClerkId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function getUsuarioActual() {
  const { userId } = await auth();
  if (!userId) return null;

  return db.usuario.findUnique({
    where: { id_usuario: userId },
    include: { jugador: true, empleado: true, admin: true },
  });
}

export async function getRolUsuario(clerkId: string): Promise<Rol | null> {
  const usuario = await db.usuario.findUnique({
    where: { id_usuario: clerkId },
    include: { jugador: true, empleado: true, admin: true },
  });

  if (!usuario) return null;
  if (usuario.admin) return "admin";
  if (usuario.empleado) return "empleado";
  if (usuario.jugador) return "jugador";
  return null;
}

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    return {
      userId: null,
      response: NextResponse.json(fail("No autenticado"), { status: 401 }),
    };
  }
  return { userId, response: null };
}

export async function requireRol(...roles: Rol[]) {
  const { userId } = await auth();
  if (!userId) {
    return {
      userId: null,
      response: NextResponse.json(fail("No autenticado"), { status: 401 }),
    };
  }

  const rol = await getRolUsuario(userId);
  if (!rol || !roles.includes(rol)) {
    return {
      userId: null,
      response: NextResponse.json(fail("Sin permisos"), { status: 403 }),
    };
  }

  return { userId, response: null };
}