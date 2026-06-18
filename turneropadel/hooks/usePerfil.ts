import { useCallback, useEffect, useState } from "react";

export type PerfilDTO = {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  telefono: string;
  ciudad: string;
  categoria: number;
  partidos_jugados: number;
  partidos_ganados: number;
  penalizaciones: number;
  reputacion_promedio: string | number;
  evaluaciones_recibidas: number;
  es_destacado: boolean;
  es_poco_confiable: boolean;
};

type EstadoFetch = "idle" | "loading" | "error";

export function usePerfil(idUsuario: string | null) {
  const [perfil, setPerfil] = useState<PerfilDTO | null>(null);
  const [estado, setEstado] = useState<EstadoFetch>("idle");
  const [error, setError] = useState<string | null>(null);

  const cargarPerfil = useCallback(async () => {
    if (!idUsuario) return;

    setEstado("loading");
    setError(null);

    try {
      const res = await fetch(`/api/usuarios/${idUsuario}/perfil`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo obtener el perfil");
      setPerfil(json);
      setEstado("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
      setEstado("error");
    }
  }, [idUsuario]);

  useEffect(() => {
    void cargarPerfil();
  }, [cargarPerfil]);

  const editarPerfil = useCallback(
    async (data: { ciudad?: string; categoria?: number; telefono?: string }) => {
      if (!idUsuario) return { error: "No autenticado" };

      try {
        const res = await fetch(`/api/usuarios/${idUsuario}/perfil`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) return { error: json.error ?? "No se pudo editar el perfil" };

        setPerfil(json);
        return { error: null };
      } catch {
        return { error: "Error de red" };
      }
    },
    [idUsuario],
  );

  return { perfil, estado, error, editarPerfil };
}