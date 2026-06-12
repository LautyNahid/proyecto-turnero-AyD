"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MisPartidosList } from "@/components/partidos/MisPartidosList";
import { LobbyDetail } from "@/components/partidos/LobbyDetail";
import { ReservaDetail } from "@/components/partidos/ReservaDetail";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Partido } from "@/lib/types";

// --- Mock data -----------------------------------------------------------
const MOCK_PARTIDOS: Partido[] = [
  {
    id: 1,
    tipo: "lobby",
    fecha: "Hoy",
    hora: "20:00",
    club: "Club Norte",
    cancha: "Cancha 3",
    duracionMin: 90,
    estado: "Abierto",
    clima: "22° despejado",
    jugadores: [
      { id: 1, name: "Martín R.", initials: "MR", level: "5ta", side: "Drive", status: "confirmed", host: true },
      { id: 2, name: "Julián L.", initials: "JL", level: "5ta", side: "Revés", status: "confirmed" },
      { id: 3, name: "Pablo A.", initials: "PA", level: "6ta", side: "Drive", status: "pending" },
      { id: 4, name: null, initials: "+", level: null, side: null, status: "empty" },
    ],
    solicitudes: [
      { id: 1, name: "Diego E.", initials: "DE", level: "5ta", side: "Revés" },
      { id: 2, name: "Tomás P.", initials: "TP", level: "6ta", side: "Drive" },
    ],
  },
  {
    id: 2,
    tipo: "reserva",
    fecha: "Mañana",
    hora: "18:30",
    club: "Padel One",
    cancha: "Cancha Central",
    duracionMin: 90,
    jugadoresConfirmados: 4,
  },
];
// -------------------------------------------------------------------------

export default function MisPartidosPage() {
  const isMobile = useIsMobile();
  const [selectedId, setSelectedId] = useState<number | null>(MOCK_PARTIDOS[0]?.id ?? null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedPartido = MOCK_PARTIDOS.find((p) => p.id === selectedId) ?? null;

  function handleSelect(id: number) {
    setSelectedId(id);
    if (isMobile) setSheetOpen(true);
  }

  const detailPanel = selectedPartido ? (
    selectedPartido.tipo === "lobby" ? (
      <LobbyDetail lobby={selectedPartido} />
    ) : (
      <ReservaDetail reserva={selectedPartido} />
    )
  ) : (
    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
      Seleccioná un partido para ver los detalles.
    </div>
  );

  return (
    <AppShell>
      {/* -m-6 lg:-m-8 cancela el padding del <main> para que el layout ocupe todo el ancho */}
      <div className="flex -m-6 lg:-m-8 h-[calc(100vh-4rem)]">
        {/* Panel izquierdo */}
        <div className="w-72 lg:w-80 shrink-0 border-r border-border flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <MisPartidosList
              partidos={MOCK_PARTIDOS}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </div>
        </div>

        {/* Panel derecho — desktop */}
        {!isMobile && (
          <div className="flex-1 overflow-y-auto p-8">
            {detailPanel}
          </div>
        )}
      </div>

      {/* Panel derecho — mobile sheet */}
      {isMobile && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader className="mb-4">
              <SheetTitle>
                {selectedPartido
                  ? `${selectedPartido.fecha} · ${selectedPartido.hora}`
                  : "Detalle"}
              </SheetTitle>
            </SheetHeader>
            {detailPanel}
          </SheetContent>
        </Sheet>
      )}
    </AppShell>
  );
}