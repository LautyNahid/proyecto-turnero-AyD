import { CanchasCrudProvider, CanchasCrudSection, CanchasKpi } from "@/components/admin/CanchasCrud";
import { AppShell } from "@/components/layout/AppShell";
import { BloqueoSection } from "@/components/admin/BloqueoSection";
import { FinalizarTurnosJobButton } from "@/components/admin/FinalizarTurnosJobButton";
import { ReservasHoyKpi, TurnosDisponiblesHoyKpi, LobbiesAbiertosHoyKpi } from "@/components/admin/ResumenHoyKpis";

export default function Admin() {
  return (
    <CanchasCrudProvider>
      <AppShell title="Panel del Complejo" subtitle="ComplejoPadel - Gestion operativa">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <ReservasHoyKpi />
          <TurnosDisponiblesHoyKpi />
          <CanchasKpi />
          <LobbiesAbiertosHoyKpi />
        </div>

        <div className="space-y-6">
          <div className="space-y-6">
            <FinalizarTurnosJobButton />

            <CanchasCrudSection />

            <BloqueoSection />
          </div>
        </div>
      </AppShell>
    </CanchasCrudProvider>
  );
}
