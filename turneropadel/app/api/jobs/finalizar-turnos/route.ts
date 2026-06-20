import { NextResponse } from "next/server";
import type { EstadoTurno } from "@prisma/client";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const TIMEZONE = "America/Argentina/Buenos_Aires";
const DURACION_TURNO_MINUTOS = 90;
const ESTADOS_FINALIZABLES: EstadoTurno[] = ["Reservado", "EnCurso"];

function getFechaKey(fecha: Date) {
  return fecha.toISOString().slice(0, 10);
}

function getFechaHoraFinTurno(fecha: Date, hora: string) {
  const inicio = fromZonedTime(`${getFechaKey(fecha)}T${hora}:00`, TIMEZONE);
  return new Date(inicio.getTime() + DURACION_TURNO_MINUTOS * 60 * 1000);
}

function getFechaArgentinaInicioDelDia(now: Date) {
  const fechaArgentina = formatInTimeZone(now, TIMEZONE, "yyyy-MM-dd");
  return fromZonedTime(`${fechaArgentina}T00:00:00`, TIMEZONE);
}

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const fechaHoyArgentina = getFechaArgentinaInicioDelDia(now);

  const turnosCandidatos = await db.turno.findMany({
    where: {
      estado_turno: { in: ESTADOS_FINALIZABLES },
      fecha: { lte: fechaHoyArgentina },
    },
    select: {
      id_turno: true,
      fecha: true,
      hora: true,
    },
  });

  const idsFinalizables = turnosCandidatos
    .filter((turno) => getFechaHoraFinTurno(turno.fecha, turno.hora).getTime() <= now.getTime())
    .map((turno) => turno.id_turno);

  if (idsFinalizables.length === 0) {
    return NextResponse.json({ finalizados: 0, ids: [] });
  }

  const result = await db.turno.updateMany({
    where: {
      id_turno: { in: idsFinalizables },
    },
    data: {
      estado_turno: "Finalizado",
    },
  });

  return NextResponse.json({
    finalizados: result.count,
    ids: idsFinalizables,
  });
}
