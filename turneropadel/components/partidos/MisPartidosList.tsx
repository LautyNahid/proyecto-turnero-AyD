"use client";

import { PartidoListItem } from "./PartidoListItem";
import type { Partido } from "@/lib/types";

interface MisPartidosListProps {
  partidos: Partido[];
  selectedId: number | null;
  selectedTipo: Partido["tipo"] | null;
  onSelect: (id: number, tipo: Partido["tipo"]) => void;
}

export function MisPartidosList({ partidos, selectedId, selectedTipo, onSelect }: MisPartidosListProps) {
  const proximos = partidos.filter((p) => {
    if (p.tipo === "lobby") return p.estado === "Abierto" || p.estado === "Confirmado";
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-1 pb-4">
        <h2 className="text-xl font-bold tracking-tight">Mis Partidos</h2>
      </div>

      {proximos.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <div>
            <div className="text-muted-foreground text-sm">No tenés partidos próximos.</div>
            <div className="text-muted-foreground text-xs mt-1">
              Reservá un turno o unite a un lobby.
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-1 pr-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-1 mb-1">
            Próximos turnos
          </div>
          {proximos.map((partido) => (
            <PartidoListItem
              key={partido.id}
              partido={partido}
              selected={selectedId === partido.id && selectedTipo === partido.tipo}
              onClick={() => onSelect(partido.id, partido.tipo)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
