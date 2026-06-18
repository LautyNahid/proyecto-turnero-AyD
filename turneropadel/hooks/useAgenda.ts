import { useEffect, useState } from "react";

export type ReservaAgenda = {
  id_reserva: number;
  id_turno: number;
  creada_en: string;
  turno: {
    id_turno: number;
    fecha: string;
    hora: string;
    precio: string | number;
    estado_turno: "Disponible" | "Reservado" | "EnCurso" | "Finalizado";
    cancha: {
      id_cancha: number;
      nro_cancha: number;
      activa: boolean;
    };
  };
};

type EstadoFetch = "idle" | "loading" | "error";

export function useAgenda(idUsuario: string | null) {
  const [agenda, setAgenda] = useState<ReservaAgenda[]>([]);
  const [estado, setEstado] = useState<EstadoFetch>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idUsuario) return;

    let cancelado = false;
    setEstado("loading");
    setError(null);

    fetch(`/api/usuarios/${idUsuario}/agenda`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudo obtener el historial");
        return json as ReservaAgenda[];
      })
      .then((data) => {
        if (!cancelado) {
          setAgenda(data);
          setEstado("idle");
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : "Error de red");
          setEstado("error");
        }
      });

    return () => {
      cancelado = true;
    };
  }, [idUsuario]);

  return { agenda, estado, error };
}