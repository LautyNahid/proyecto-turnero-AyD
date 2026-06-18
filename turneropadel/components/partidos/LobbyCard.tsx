import { Skeleton } from "@/components/ui/skeleton";
import { Cloud, Clock } from "lucide-react";
import type { LobbyConRelaciones } from "@/lib/repositories/lobby.repository";

interface LobbyCardProps {
  lobby: LobbyConRelaciones;
  onClick: () => void;
}

export function LobbyCard({ lobby, onClick }: LobbyCardProps) {
  const jugadoresActivos = lobby.jugadores.length;
  const fecha = new Date(lobby.turno.fecha).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <button
      onClick={onClick}
      className="bg-card rounded-2xl p-5 shadow-soft border border-border hover:shadow-card hover:-translate-y-0.5 transition group text-left w-full cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime text-lime-foreground">
          {lobby.jugadores_faltantes}{" "}
          {lobby.jugadores_faltantes === 1 ? "lugar" : "lugares"}
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Cloud className="size-3" /> —
        </span>
      </div>
      <div className="mt-3 font-bold leading-tight">
        Cancha {lobby.turno.cancha.nro_cancha}
      </div>
      <div className="text-xs text-muted-foreground">
        Cat. {lobby.creador.categoria}
      </div>
      <div className="mt-3 text-sm font-semibold flex items-center gap-1.5">
        <Clock className="size-3.5" />
        {fecha} · {lobby.turno.hora}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex -space-x-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`size-6 rounded-full ring-2 ring-card text-[9px] font-bold flex items-center justify-center ${
                i < jugadoresActivos
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground border border-dashed border-border"
              }`}
            >
              {i < jugadoresActivos ? "•" : "+"}
            </div>
          ))}
        </div>
        <div className="text-sm font-bold">
          ${Number(lobby.turno.precio).toLocaleString("es-AR")}
        </div>
      </div>
    </button>
  );
}

export function LobbyCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-px w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}