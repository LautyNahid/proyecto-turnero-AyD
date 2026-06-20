"use client";

import { useEffect, useState } from "react";
import type { Rol } from "@/lib/types";
import type { ApiResponse } from "@/lib/types";

let cache: Rol[] | null = null;
let inFlight: Promise<Rol[]> | null = null;

async function fetchRoles(): Promise<Rol[]> {
  if (cache) return cache;
  if (!inFlight) {
    inFlight = fetch("/api/usuarios/yo")
      .then((res) => (res.ok ? res.json() : { data: { roles: [] } }))
      .then((json: ApiResponse<{ roles: Rol[] }>) => {
        cache = json.data?.roles ?? [];
        return cache;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

export function useRolUsuario() {
  const [roles, setRoles] = useState<Rol[] | null>(cache);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    if (cache) return;
    let activo = true;
    fetchRoles().then((r) => {
      if (activo) {
        setRoles(r);
        setLoading(false);
      }
    });
    return () => {
      activo = false;
    };
  }, []);

  return { roles: roles ?? [], loading };
}