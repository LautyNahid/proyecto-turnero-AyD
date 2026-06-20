import type { Rol } from "@/lib/types";

export const RUTAS_PUBLICAS = [
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/jobs/finalizar-turnos",
];

export const RUTAS_ADMIN = ["/admin(.*)"];

export type Accion =
  | "cancha.crear"
  | "cancha.editar"
  | "cancha.eliminar"
  | "cancha.precio.modificar"
  | "turno.bloquear"
  | "reserva.cancelar.ajena"
  | "lobby.cancelar.ajena"
  | "reporte.generar"
  | "reporte.ver"
  | "reporte.exportar";

const MATRIZ_ACCIONES: Record<Accion, Rol[]> = {
  "cancha.crear": ["admin"],
  "cancha.editar": ["admin"],
  "cancha.eliminar": ["admin"],
  "cancha.precio.modificar": ["admin"],
  "turno.bloquear": ["admin", "empleado"],
  "reserva.cancelar.ajena": ["admin", "empleado"],
  "reporte.generar": ["admin", "empleado"],
  "reporte.ver": ["admin", "empleado"],
  "reporte.exportar": ["admin", "empleado"],
  "lobby.cancelar.ajena": ["admin", "empleado"],
};

export function puedeEjecutar(roles: Rol[], accion: Accion): boolean {
  return MATRIZ_ACCIONES[accion].some((rolPermitido) => roles.includes(rolPermitido));
}

export function puedeVerPanelAdmin(roles: Rol[]): boolean {
  return roles.some((r) => r === "admin" || r === "empleado");
}
