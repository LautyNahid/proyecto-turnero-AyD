import {
  reporteSemanalRepository,
  reporteEstadisticasRepository,
} from "@/lib/repositories/reporte.repository";
import type {
  ReporteSemanalRepository,
  ReporteEstadisticasRepository,
} from "@/lib/repositories/reporte.repository";
import { ServiceError } from "@/lib/services/service-error";
import { isKnownPrismaError } from "@/lib/repositories/reserva.repository";
import { fromZonedTime } from "date-fns-tz";

const TIMEZONE = "America/Argentina/Buenos_Aires";

// ─── Tipos de salida (forma del datos_json persistido) ─────────────────────

export type ReporteCancha = {
  id_cancha: number;
  nro_cancha: number;
  total_reservas: number;
  ingresos: number;
  hora_pico: string | null;
};

export type ReporteJugador = {
  id_jugador: string;
  partidos_jugados: number;
  promedio_puntaje: number;
  penalizaciones: number;
};

export type ReporteDatos = {
  periodo: { inicio: string; fin: string };
  canchas: ReporteCancha[];
  jugadores: ReporteJugador[];
  metricas_globales: {
    total_ingresos: number;
    cancha_mas_demandada: number | null;
    hora_pico_global: string | null;
    porcentaje_cancelaciones: number;
  };
};

// ─── Validación de input ────────────────────────────────────────────────────

function parseSemanaInicio(value: unknown): Date {
  if (typeof value !== "string") {
    throw new ServiceError("El parámetro 'semana' es obligatorio (YYYY-MM-DD)");
  }

  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateOnlyPattern.test(value)) {
    throw new ServiceError("'semana' debe tener formato YYYY-MM-DD");
  }

  const inicio = fromZonedTime(`${value}T00:00:00`, TIMEZONE);
  if (Number.isNaN(inicio.getTime())) {
    throw new ServiceError("'semana' es una fecha inválida");
  }

  // getDay() en UTC del instante convertido no sirve para validar el día local;
  // se valida sobre el string original interpretado como fecha local.
  const [y, m, d] = value.split("-").map(Number);
  const diaSemanaLocal = new Date(y, m - 1, d).getDay(); // 0=domingo..6=sabado, 1=lunes
  if (diaSemanaLocal !== 1) {
    throw new ServiceError("'semana' debe ser un lunes (inicio de semana)");
  }

  return inicio;
}

function calcularFinDeSemana(inicio: Date): Date {
  const fin = new Date(inicio);
  fin.setUTCDate(fin.getUTCDate() + 6);
  fin.setUTCHours(23, 59, 59, 999);
  return fin;
}

export class ReporteService {
  constructor(
    private readonly reporteRepo: ReporteSemanalRepository,
    private readonly estadisticasRepo: ReporteEstadisticasRepository,
  ) {}

  async generarReporteSemanal(semanaParam: unknown) {
    const periodo_inicio = parseSemanaInicio(semanaParam);
    const periodo_fin = calcularFinDeSemana(periodo_inicio);

    const datos = await this.construirDatosReporte(periodo_inicio, periodo_fin);

    try {
      return await this.reporteRepo.create({
        periodo_inicio,
        periodo_fin,
        datos_json: datos,
      });
    } catch (error) {
      if (isKnownPrismaError(error, "P2002")) {
        throw new ServiceError("Ya existe un reporte generado para ese período", 409);
      }
      throw error;
    }
  }

  async obtenerReporteSemanal(semanaParam: unknown) {
    const periodo_inicio = parseSemanaInicio(semanaParam);
    const periodo_fin = calcularFinDeSemana(periodo_inicio);

    const reporte = await this.reporteRepo.findByPeriodo(periodo_inicio, periodo_fin);

    if (!reporte) {
      throw new ServiceError("No existe un reporte generado para ese período", 404);
    }

    return reporte;
  }

  obtenerListado() {
    return this.reporteRepo.findAllResumen();
  }

  private async construirDatosReporte(inicio: Date, fin: Date): Promise<ReporteDatos> {
    const [
      reservasPorCancha,
      horasPorCancha,
      partidosPorJugador,
      puntajePorJugador,
      penalizacionesPorJugador,
      cancelaciones,
      confirmadas,
    ] = await Promise.all([
      this.estadisticasRepo.reservasPorCancha(inicio, fin),
      this.estadisticasRepo.horasPorCancha(inicio, fin),
      this.estadisticasRepo.partidosJugadosPorJugador(inicio, fin),
      this.estadisticasRepo.puntajePromedioPorJugador(inicio, fin),
      this.estadisticasRepo.penalizacionesPorJugador(inicio, fin),
      this.estadisticasRepo.cantidadCancelaciones(inicio, fin),
      this.estadisticasRepo.cantidadReservasConfirmadas(inicio, fin),
    ]);

    // hora pico por cancha = la hora con más reservas dentro de esa cancha
    const horaPicoPorCancha = new Map<number, { hora: string; cantidad: number }>();
    for (const h of horasPorCancha) {
      const actual = horaPicoPorCancha.get(h.id_cancha);
      if (!actual || h.cantidad > actual.cantidad) {
        horaPicoPorCancha.set(h.id_cancha, { hora: h.hora, cantidad: h.cantidad });
      }
    }

    const canchas: ReporteCancha[] = reservasPorCancha.map((c) => ({
      id_cancha: c.id_cancha,
      nro_cancha: c.nro_cancha,
      total_reservas: c.total_reservas,
      ingresos: c.ingresos,
      hora_pico: horaPicoPorCancha.get(c.id_cancha)?.hora ?? null,
    }));

    const idsJugadores = new Set<string>([
      ...partidosPorJugador.map((p) => p.id_jugador),
      ...puntajePorJugador.map((p) => p.id_jugador),
      ...penalizacionesPorJugador.map((p) => p.id_jugador),
    ]);

    const partidosMap = new Map(partidosPorJugador.map((p) => [p.id_jugador, p.partidos_jugados]));
    const puntajeMap = new Map(puntajePorJugador.map((p) => [p.id_jugador, p.promedio_puntaje]));
    const penalizacionesMap = new Map(
      penalizacionesPorJugador.map((p) => [p.id_jugador, p.penalizaciones]),
    );

    const jugadores: ReporteJugador[] = Array.from(idsJugadores).map((id_jugador) => ({
      id_jugador,
      partidos_jugados: partidosMap.get(id_jugador) ?? 0,
      promedio_puntaje: puntajeMap.get(id_jugador) ?? 0,
      penalizaciones: penalizacionesMap.get(id_jugador) ?? 0,
    }));

    const total_ingresos = canchas.reduce((acc, c) => acc + c.ingresos, 0);

    const canchaMasDemandada = canchas.reduce<ReporteCancha | null>((max, c) => {
      if (!max || c.total_reservas > max.total_reservas) return c;
      return max;
    }, null);

    const horaPicoGlobal = horasPorCancha.reduce<{ hora: string; cantidad: number } | null>(
      (max, h) => {
        if (!max || h.cantidad > max.cantidad) return { hora: h.hora, cantidad: h.cantidad };
        return max;
      },
      null,
    );

    const totalParaPorcentaje = confirmadas + cancelaciones;
    const porcentaje_cancelaciones =
      totalParaPorcentaje > 0 ? (cancelaciones / totalParaPorcentaje) * 100 : 0;

    return {
      periodo: {
        inicio: inicio.toISOString().slice(0, 10),
        fin: fin.toISOString().slice(0, 10),
      },
      canchas,
      jugadores,
      metricas_globales: {
        total_ingresos,
        cancha_mas_demandada: canchaMasDemandada?.id_cancha ?? null,
        hora_pico_global: horaPicoGlobal?.hora ?? null,
        porcentaje_cancelaciones: Math.round(porcentaje_cancelaciones * 100) / 100,
      },
    };
  }
}

export const reporteService = new ReporteService(reporteSemanalRepository, reporteEstadisticasRepository);