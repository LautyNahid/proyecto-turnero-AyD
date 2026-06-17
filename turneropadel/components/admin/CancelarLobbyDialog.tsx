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

function formatFecha(fecha: Date): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
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
  return (
    <Dialog open={!!lobby} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar lobby</DialogTitle>
          <DialogDescription>
            {lobby && (
              <>
                Vas a cancelar el lobby #{lobby.id_lobby} del{" "}
                {formatFecha(lobby.turno.fecha)} a las {lobby.turno.hora} en la Cancha{" "}
                {lobby.turno.cancha.nro_cancha}. Esta acción no se puede deshacer.
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