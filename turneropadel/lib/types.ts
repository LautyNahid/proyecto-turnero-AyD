export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
};

export type Rol = "jugador" | "empleado" | "admin";

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> {
  return { data, error: null, ...(meta ? { meta } : {}) };
}

export function fail(error: string): ApiResponse<null> {
  return { data: null, error };
}

