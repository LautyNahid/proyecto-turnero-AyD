import { fromZonedTime } from "date-fns-tz";
import { ServiceError } from "@/lib/services/service-error";
import { TtlCache } from "@/lib/cache";

const TIMEZONE = "America/Argentina/Buenos_Aires";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos
const FETCH_TIMEOUT_MS = 3000;
const HORIZONTE_PREDICCION_DIAS = 5; // limite real del plan free de OpenWeather (forecast 5 dias / 3hs)

export type ClimaDTO = {
  temperatura_celsius: number;
  descripcion: string;
  humedad_porcentaje: number;
  viento_kmh: number;
  probabilidad_lluvia_porcentaje: number;
  fecha_consulta: string;
};

const climaCache = new TtlCache<ClimaDTO>(CACHE_TTL_MS);

function parseFechaParam(value: string): Date {
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateOnlyPattern.test(value)) {
    throw new ServiceError("El parametro fecha debe tener formato YYYY-MM-DD");
  }

  const fecha = fromZonedTime(`${value}T00:00:00`, TIMEZONE);

  if (Number.isNaN(fecha.getTime())) {
    throw new ServiceError("El parametro fecha es invalido");
  }

  return fecha;
}

function parseHoraParam(value: string): string {
  const horaPattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!horaPattern.test(value)) {
    throw new ServiceError("El parametro hora debe tener formato HH:mm");
  }

  return value;
}

function getUbicacionComplejo() {
  const lat = process.env.COMPLEJO_LATITUD;
  const lon = process.env.COMPLEJO_LONGITUD;

  if (!lat || !lon) {
    throw new ServiceError("La ubicacion del complejo no esta configurada", 500);
  }

  return { lat, lon };
}

function combinarFechaHoraUTC(fecha: Date, hora: string): Date {
  const fechaStr = fecha.toISOString().slice(0, 10);
  return fromZonedTime(`${fechaStr}T${hora}:00`, TIMEZONE);
}

function obtenerBloqueUTC(fechaHoraUTC: Date): Date {
  const bloque = new Date(fechaHoraUTC);
  bloque.setUTCMinutes(0, 0, 0);
  bloque.setUTCHours(Math.floor(bloque.getUTCHours() / 3) * 3);
  return bloque;
}

function formatearDtTxt(fecha: Date): string {
  return fecha.toISOString().slice(0, 19).replace("T", " ");
}

function construirClaveCache(lat: string, lon: string, bloqueUTC: Date): string {
  return `clima:${lat}:${lon}:${formatearDtTxt(bloqueUTC)}`;
}

function excedeHorizontePrediccion(fechaHoraUTC: Date): boolean {
  const limite = new Date();
  limite.setUTCDate(limite.getUTCDate() + HORIZONTE_PREDICCION_DIAS);
  return fechaHoraUTC.getTime() > limite.getTime();
}

async function consultarOpenWeather(lat: string, lon: string) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new ServiceError("OPENWEATHER_API_KEY no configurada", 500);
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${apiKey}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      const body = await response.text();
      console.error("[clima.service] OpenWeather respondio con error", response.status, body);
      throw new ServiceError("El pronostico no esta disponible en este momento", 503);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    console.error("[clima.service] Fallo la consulta a OpenWeather", error);
    throw new ServiceError("El pronostico no esta disponible en este momento", 503);
  } finally {
    clearTimeout(timeout);
  }
}

function elegirBloquePrediccion(data: any, bloqueUTC: Date) {
  const dtTxtObjetivo = formatearDtTxt(bloqueUTC);
  const bloque = data.list?.find((item: any) => item.dt_txt === dtTxtObjetivo) ?? data.list?.[0];

  if (!bloque) {
    throw new ServiceError("El pronostico no esta disponible en este momento", 503);
  }

  return bloque;
}

function transformarABloqueDTO(bloque: any): ClimaDTO {
  return {
    temperatura_celsius: bloque.main.temp,
    descripcion: bloque.weather?.[0]?.description ?? "sin datos",
    humedad_porcentaje: bloque.main.humidity,
    viento_kmh: Math.round((bloque.wind?.speed ?? 0) * 3.6),
    probabilidad_lluvia_porcentaje: Math.round((bloque.pop ?? 0) * 100),
    fecha_consulta: new Date().toISOString(),
  };
}

export class ClimaService {
  async obtenerClima(fechaParam: string, horaParam: string): Promise<ClimaDTO> {
    const fecha = parseFechaParam(fechaParam);
    const hora = parseHoraParam(horaParam);
    const fechaHoraUTC = combinarFechaHoraUTC(fecha, hora);

    if (excedeHorizontePrediccion(fechaHoraUTC)) {
      throw new ServiceError("El pronostico aun no esta disponible para esta fecha", 422);
    }

    const { lat, lon } = getUbicacionComplejo();
    const bloqueUTC = obtenerBloqueUTC(fechaHoraUTC);
    const claveCache = construirClaveCache(lat, lon, bloqueUTC);

    const cacheado = climaCache.get(claveCache);
    if (cacheado) return cacheado;

    const data = await consultarOpenWeather(lat, lon);
    const bloque = elegirBloquePrediccion(data, bloqueUTC);
    const dto = transformarABloqueDTO(bloque);

    climaCache.set(claveCache, dto);
    return dto;
  }
}

export const climaService = new ClimaService();