import { NextResponse } from "next/server";
import { turnoFinalizacionService } from "@/lib/services/turno-finalizacion.service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await turnoFinalizacionService.finalizarTurnosVencidos();
  return NextResponse.json(result);
}
