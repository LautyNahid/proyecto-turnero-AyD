import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LobbyConRelaciones } from "@/lib/repositories/lobby.repository";

interface CancelarLobbyDialogProps {
  lobby: LobbyConRelaciones | null;
  cancelando: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}

import { parseLocalDate } from "@/lib/utils";

function formatFecha(fecha: string | Date | null | undefined): string {
  if (fecha === null || fecha === undefined) return "Sin fecha";
  return parseLocalDate(fecha).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function CancelarLobbyDialog({
  lobby,
  cancelando,
  onConfirmar,
  onCerrar,
}: CancelarLobbyDialogProps) {
  const fecha = lobby?.turno ? formatFecha(lobby.turno.fecha) : "Turno no asignado";
  const hora = lobby?.turno?.hora ?? "—";
  const cancha = lobby?.turno?.cancha?.nro_cancha ?? "—";

  return (
    <Dialog open={!!lobby} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar lobby</DialogTitle>
          <DialogDescription>
            {lobby && (
              <>
                Vas a cancelar el lobby #{lobby.id_lobby} del{" "}
                {fecha} a las {hora} en la Cancha{" "}
                {cancha}. Esta acción no se puede deshacer.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCerrar} disabled={cancelando}>
            Volver
          </Button>
          <Button variant="destructive" onClick={onConfirmar} disabled={cancelando}>
            {cancelando ? "Cancelando..." : "Confirmar cancelación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}