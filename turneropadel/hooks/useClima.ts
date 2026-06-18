import { useEffect, useState } from "react";

export type ClimaDTO = {
  temperatura_celsius: number;
  descripcion: string;
  humedad_porcentaje: number;
  viento_kmh: number;
  probabilidad_lluvia_porcentaje: number;
  fecha_consulta: string;
};

type EstadoFetch = "idle" | "loading" | "error";

type UseClimaReturn = {
  clima: ClimaDTO | null;
  estado: EstadoFetch;
  error: string | null;
};

export function useClima(fecha: string | null, hora: string | null): UseClimaReturn {
  const [clima, setClima] = useState<ClimaDTO | null>(null);
  const [estado, setEstado] = useState<EstadoFetch>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fecha || !hora) {
      setClima(null);
      setEstado("idle");
      setError(null);
      return;
    }

    let cancelado = false;
    setEstado("loading");
    setError(null);

    const params = new URLSearchParams({ fecha, hora });

    fetch(`/api/clima?${params.toString()}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudo obtener el clima");
        return json as ClimaDTO;
      })
      .then((data) => {
        if (!cancelado) {
          setClima(data);
          setEstado("idle");
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : "Error de red");
          setEstado("error");
          setClima(null);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [fecha, hora]);

  return { clima, estado, error };
}