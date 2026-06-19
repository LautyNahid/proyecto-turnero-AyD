import { Prisma, TipoNotificacion } from "@prisma/client";
import type { ReporteSemanal } from "@prisma/client";
import { db } from "@/lib/db";

// ─── Tipos de datos crudos que arma este repository (entrada para el service) ──

export type IngresosYReservasPorCancha = {
  id_cancha: number;
  nro_cancha: number;
  total_reservas: number;
  ingresos: number;
};

export type HorasPorCancha = {
  id_cancha: number;
  hora: string;
  cantidad: number;
};

export type PartidosPorJugador = {
  id_jugador: string;
  partidos_jugados: number;
};

export type PuntajePromedioPorJugador = {
  id_jugador: string;
  promedio_puntaje: number;
};

export type PenalizacionesPorJugador = {
  id_jugador: string;
  penalizaciones: number;
};

// ─── Interfaces (ISP: una para persistencia, otra para agregaciones) ──────────

export type ReporteSemanalResumen = {
  id_reporte: number;
  periodo_inicio: Date;
  periodo_fin: Date;
  generado_en: Date;
};

export interface ReporteSemanalRepository {
  findByPeriodo(periodo_inicio: Date, periodo_fin: Date): Promise<ReporteSemanal | null>;
  findById(id_reporte: number): Promise<ReporteSemanal | null>;
  findAllResumen(): Promise<ReporteSemanalResumen[]>;
  create(data: { periodo_inicio: Date; periodo_fin: Date; datos_json: Prisma.InputJsonValue }): Promise<ReporteSemanal>;
}

export interface ReporteEstadisticasRepository {
  reservasPorCancha(inicio: Date, fin: Date): Promise<IngresosYReservasPorCancha[]>;
  horasPorCancha(inicio: Date, fin: Date): Promise<HorasPorCancha[]>;
  partidosJugadosPorJugador(inicio: Date, fin: Date): Promise<PartidosPorJugador[]>;
  puntajePromedioPorJugador(inicio: Date, fin: Date): Promise<PuntajePromedioPorJugador[]>;
  penalizacionesPorJugador(inicio: Date, fin: Date): Promise<PenalizacionesPorJugador[]>;
  cantidadCancelaciones(inicio: Date, fin: Date): Promise<number>;
  cantidadReservasConfirmadas(inicio: Date, fin: Date): Promise<number>;
}

// ─── Implementación Prisma ─────────────────────────────────────────────────────

export class PrismaReporteSemanalRepository implements ReporteSemanalRepository {
  findByPeriodo(periodo_inicio: Date, periodo_fin: Date) {
    return db.reporteSemanal.findUnique({
      where: { periodo_inicio_periodo_fin: { periodo_inicio, periodo_fin } },
    });
  }

  findById(id_reporte: number) {
    return db.reporteSemanal.findUnique({ where: { id_reporte } });
  }

  findAllResumen() {
    return db.reporteSemanal.findMany({
      select: { id_reporte: true, periodo_inicio: true, periodo_fin: true, generado_en: true },
      orderBy: { periodo_inicio: "desc" },
    });
  }

  create(data: { periodo_inicio: Date; periodo_fin: Date; datos_json: Prisma.InputJsonValue }) {
    return db.reporteSemanal.create({ data });
  }
}

export class PrismaReporteEstadisticasRepository implements ReporteEstadisticasRepository {
  async reservasPorCancha(inicio: Date, fin: Date) {
    const turnos = await db.turno.findMany({
      where: {
        fecha: { gte: inicio, lte: fin },
        reserva: { isNot: null },
      },
      select: {
        id_cancha: true,
        cancha: { select: { nro_cancha: true } },
        precio: true,
      },
    });

    const acumulado = new Map<number, IngresosYReservasPorCancha>();
    for (const turno of turnos) {
      const actual = acumulado.get(turno.id_cancha) ?? {
        id_cancha: turno.id_cancha,
        nro_cancha: turno.cancha.nro_cancha,
        total_reservas: 0,
        ingresos: 0,
      };
      actual.total_reservas += 1;
      actual.ingresos += Number(turno.precio);
      acumulado.set(turno.id_cancha, actual);
    }

    return Array.from(acumulado.values());
  }

  async horasPorCancha(inicio: Date, fin: Date) {
    const turnos = await db.turno.findMany({
      where: { fecha: { gte: inicio, lte: fin }, reserva: { isNot: null } },
      select: { id_cancha: true, hora: true },
    });

    const acumulado = new Map<string, HorasPorCancha>();
    for (const turno of turnos) {
      const key = `${turno.id_cancha}-${turno.hora}`;
      const actual = acumulado.get(key) ?? { id_cancha: turno.id_cancha, hora: turno.hora, cantidad: 0 };
      actual.cantidad += 1;
      acumulado.set(key, actual);
    }

    return Array.from(acumulado.values());
  }

  async partidosJugadosPorJugador(inicio: Date, fin: Date) {
    // "Partidos jugados" = reservas cuyo turno llegó a Finalizado dentro del período.
    // OJO: hoy no hay proceso automático que pase Reservado -> Finalizado (limitación conocida),
    // por lo que este número va a ser 0 salvo que se finalicen turnos manualmente.
    const reservas = await db.reserva.findMany({
      where: {
        turno: { fecha: { gte: inicio, lte: fin }, estado_turno: "Finalizado" },
      },
      select: { id_jugador: true },
    });

    const acumulado = new Map<string, number>();
    for (const r of reservas) {
      acumulado.set(r.id_jugador, (acumulado.get(r.id_jugador) ?? 0) + 1);
    }

    return Array.from(acumulado.entries()).map(([id_jugador, partidos_jugados]) => ({
      id_jugador,
      partidos_jugados,
    }));
  }

  async puntajePromedioPorJugador(inicio: Date, fin: Date) {
    const resultado = await db.evaluacionJugador.groupBy({
      by: ["id_evaluado"],
      where: { creada_en: { gte: inicio, lte: fin } },
      _avg: { puntaje: true },
    });

    return resultado.map((r) => ({
      id_jugador: r.id_evaluado,
      promedio_puntaje: r._avg.puntaje ?? 0,
    }));
  }

  async penalizacionesPorJugador(inicio: Date, fin: Date) {
    // Las penalizaciones se acumulan como contador total en Jugador (no hay historial por fecha),
    // así que esto refleja el contador actual, no las generadas estrictamente "en el período".
    const jugadores = await db.jugador.findMany({
      where: { penalizaciones: { gt: 0 } },
      select: { id_usuario: true, penalizaciones: true },
    });

    return jugadores.map((j) => ({ id_jugador: j.id_usuario, penalizaciones: j.penalizaciones }));
  }

  cantidadCancelaciones(inicio: Date, fin: Date) {
    return db.notificacion.count({
      where: { tipo: TipoNotificacion.ReservaCancelada, creada_en: { gte: inicio, lte: fin } },
    });
  }

  cantidadReservasConfirmadas(inicio: Date, fin: Date) {
    return db.reserva.count({
      where: { turno: { fecha: { gte: inicio, lte: fin } } },
    });
  }
}

export const reporteSemanalRepository = new PrismaReporteSemanalRepository();
export const reporteEstadisticasRepository = new PrismaReporteEstadisticasRepository();