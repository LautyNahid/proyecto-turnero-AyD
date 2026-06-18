import {
  jugadorRepository,
} from "@/lib/repositories/jugador.repository";
import type {
  JugadorConUsuario,
  JugadorRepository,
} from "@/lib/repositories/jugador.repository";
import { usuarioRepository } from "@/lib/repositories/usuario.repository";
import type { UsuarioRepository } from "@/lib/repositories/usuario.repository";
import { ServiceError } from "@/lib/services/service-error";

function ensureObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") {
    throw new ServiceError("Body invalido");
  }
  return body as Record<string, unknown>;
}

function parseTelefono(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ServiceError("El telefono debe ser un texto no vacio");
  }
  return value.trim();
}

function parseCiudad(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ServiceError("La ciudad debe ser un texto no vacio");
  }
  return value.trim();
}

function parseCategoria(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new ServiceError("La categoria debe ser un entero positivo");
  }
  return value;
}

function toPerfilDTO(jugador: JugadorConUsuario) {
  return {
    id_usuario: jugador.id_usuario,
    nombre: jugador.usuario.nombre,
    apellido: jugador.usuario.apellido,
    correo_electronico: jugador.usuario.correo_electronico,
    telefono: jugador.usuario.telefono,
    ciudad: jugador.ciudad,
    categoria: jugador.categoria,
    partidos_jugados: jugador.partidos_jugados,
    partidos_ganados: jugador.partidos_ganados,
    penalizaciones: jugador.penalizaciones,
    reputacion_promedio: jugador.reputacion_promedio,
    evaluaciones_recibidas: jugador.evaluaciones_recibidas,
    es_destacado: jugador.es_destacado,
    es_poco_confiable: jugador.es_poco_confiable,
  };
}

export class UsuarioService {
  constructor(
    private readonly jugadorRepo: JugadorRepository,
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  async obtenerPerfil(idUsuarioParam: string, idAutenticado: string) {
    this.ensurePropioPerfil(idUsuarioParam, idAutenticado);

    const jugador = await this.jugadorRepo.findByIdConUsuario(idUsuarioParam);
    if (!jugador) {
      throw new ServiceError("Jugador no encontrado", 404);
    }

    return toPerfilDTO(jugador);
  }

  async editarPerfil(idUsuarioParam: string, idAutenticado: string, body: unknown) {
    this.ensurePropioPerfil(idUsuarioParam, idAutenticado);

    const payload = ensureObject(body);
    const jugadorActual = await this.jugadorRepo.findByIdConUsuario(idUsuarioParam);
    if (!jugadorActual) {
      throw new ServiceError("Jugador no encontrado", 404);
    }

    if ("telefono" in payload) {
      await this.usuarioRepo.update(idUsuarioParam, { telefono: parseTelefono(payload.telefono) });
    }

    const datosJugador: { ciudad?: string; categoria?: number } = {};
    if ("ciudad" in payload) datosJugador.ciudad = parseCiudad(payload.ciudad);
    if ("categoria" in payload) datosJugador.categoria = parseCategoria(payload.categoria);

    if (Object.keys(datosJugador).length > 0) {
      await this.jugadorRepo.update(idUsuarioParam, datosJugador);
    }

    const actualizado = await this.jugadorRepo.findByIdConUsuario(idUsuarioParam);
    return toPerfilDTO(actualizado!);
  }

  private ensurePropioPerfil(idUsuarioParam: string, idAutenticado: string) {
    if (idUsuarioParam !== idAutenticado) {
      throw new ServiceError("No podes acceder al perfil de otro usuario", 403);
    }
  }
}

export const usuarioService = new UsuarioService(jugadorRepository, usuarioRepository);