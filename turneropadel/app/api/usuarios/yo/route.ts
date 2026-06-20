import { NextResponse } from "next/server";
import { requireAuth, getRolUsuario } from "@/lib/auth";
import { ok, fail } from "@/lib/types";

export async function GET() {
  const { userId, response } = await requireAuth();
  if (response) return response;

  const roles = await getRolUsuario(userId!);
  if (!roles) {
    return NextResponse.json(fail("Usuario no encontrado"), { status: 404 });
  }

  return NextResponse.json(ok({ roles }));
}

