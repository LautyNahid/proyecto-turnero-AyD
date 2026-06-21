import { NextResponse } from "next/server";
import { requireRol } from "@/lib/auth";
import { turnoFinalizacionService } from "@/lib/services/turno-finalizacion.service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  const autorizadoPorCron = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

  if (!autorizadoPorCron) {
    const { response } = await requireRol("admin", "empleado");
    if (response) return response;
  }

  const result = await turnoFinalizacionService.finalizarTurnosVencidos();
  return NextResponse.json(result);
}
