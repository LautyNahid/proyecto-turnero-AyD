"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AppShell } from "@/components/layout/AppShell";
import { Trophy, Star, Edit3, CalendarRange, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePerfil } from "@/hooks/usePerfil";
import { useAgenda } from "@/hooks/useAgenda";
import { EvaluacionSheet } from "@/components/evaluaciones/EvaluacionSheet";

const tabs = ["Próximos", "Completados"] as const;
type Tab = (typeof tabs)[number];

interface Partido {
  id: number;
  club: string;
  date: string;
  court: string;
  status: string;
}

export default function Perfil() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const idUsuario = isLoaded ? user?.id ?? null : null;

  const { perfil, estado: perfilEstado, error: perfilError, editarPerfil } = usePerfil(idUsuario);
  const { agenda, estado: agendaEstado, error: agendaError } = useAgenda(idUsuario);

  const [tab, setTab] = useState<Tab>("Próximos");
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<Partido | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [ciudad, setCiudad] = useState("");
  const [categoria, setCategoria] = useState("");
  const [telefono, setTelefono] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const partidosFiltrados = useMemo(() => {
    return agenda.filter((reserva) =>
      tab === "Próximos"
        ? reserva.turno.estado_turno !== "Finalizado"
        : reserva.turno.estado_turno === "Finalizado",
    );
  }, [agenda, tab]);

  function abrirEdicion() {
    if (!perfil) return;
    setCiudad(perfil.ciudad);
    setCategoria(String(perfil.categoria));
    setTelefono(perfil.telefono);
    setSaveError(null);
    setEditOpen(true);
  }

  async function guardarEdicion() {
    setSaving(true);
    setSaveError(null);

    const { error } = await editarPerfil({
      ciudad,
      categoria: Number(categoria),
      telefono,
    });

    setSaving(false);

    if (error) {
      setSaveError(error);
      return;
    }

    setEditOpen(false);
  }

  function abrirEvaluacion(reserva: (typeof agenda)[number]) {
    setPartidoSeleccionado({
      id: reserva.id_reserva,
      club: "ComplejoPadel",
      court: `Cancha ${reserva.turno.cancha.nro_cancha}`,
      date: `${reserva.turno.fecha.slice(0, 10)} - ${reserva.turno.hora}`,
      status: reserva.turno.estado_turno,
    });
  }

  function abrirPartido(reserva: (typeof agenda)[number]) {
    router.push(`/partidos?tipo=reserva&id=${reserva.id_reserva}`);
  }

  const nombreClerk =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.primaryEmailAddress?.emailAddress ||
    "";
  const nombreDb = perfil ? `${perfil.nombre} ${perfil.apellido}`.trim() : "";
  const nombreCompleto = nombreDb || nombreClerk || "Usuario";
  const iniciales = getInitials(nombreCompleto);
  const fotoPerfil = user?.imageUrl;

  return (
    <AppShell title="Mi perfil" subtitle="Tus datos y tu historial deportivo">
      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        {/* ── Columna izquierda ── */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border shadow-card p-6 text-center relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-24" style={{ background: "var(--gradient-court)" }} />
            <div className="relative">
              {perfilEstado === "loading" ? (
                <div className="flex justify-center mt-6">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : perfilError ? (
                <p className="mt-6 text-sm text-destructive">{perfilError}</p>
              ) : perfil ? (
                <>
                  {fotoPerfil ? (
                    <div
                      className="size-24 rounded-full bg-cover bg-center mx-auto ring-4 ring-card mt-6"
                      style={{ backgroundImage: `url(${fotoPerfil})` }}
                      aria-label={`Foto de perfil de ${nombreCompleto}`}
                    />
                  ) : (
                    <div className="size-24 rounded-full bg-lime text-lime-foreground text-3xl font-bold flex items-center justify-center mx-auto ring-4 ring-card mt-6">
                      {iniciales}
                    </div>
                  )}
                  <div className="mt-3 font-bold text-lg">{nombreCompleto}</div>
                  <div className="text-xs text-muted-foreground">{perfil.ciudad}</div>
                  <button
                    onClick={abrirEdicion}
                    className="mt-3 text-xs inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                  >
                    <Edit3 className="size-3" /> Editar perfil
                  </button>
                  <div className="grid grid-cols-2 gap-2 mt-5 pt-5 border-t border-border text-left">
                    <StatItem label="Nivel" value={`${perfil.categoria}ta`} icon={Trophy} />
                    <StatItem label="Reputacion" value={Number(perfil.reputacion_promedio).toFixed(1)} icon={Star} />
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-soft p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Estadísticas</div>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Partidos jugados" value={String(perfil?.partidos_jugados ?? 0)} />
              <Row label="Victorias" value={String(perfil?.partidos_ganados ?? 0)} />
            </div>
          </div>
        </div>

        {/* ── Columna derecha ── */}
        <div>
          <div className="flex gap-1 bg-muted rounded-full p-1 w-fit mb-4">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-1.5 text-sm font-semibold rounded-full transition ${tab === t ? "bg-card shadow-soft" : "text-muted-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>

          {agendaEstado === "loading" ? (
            <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> Cargando historial...
            </div>
          ) : agendaError ? (
            <div className="flex items-center justify-center h-40 text-sm text-destructive">{agendaError}</div>
          ) : partidosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <CalendarRange className="size-8" />
              <span className="text-sm">No hay partidos para mostrar</span>
            </div>
          ) : (
            <div className="space-y-3">
              {partidosFiltrados.map((reserva) => (
                <button
                  key={reserva.id_reserva}
                  onClick={() => (tab === "Completados" ? abrirEvaluacion(reserva) : abrirPartido(reserva))}
                  className="w-full text-left bg-card rounded-2xl border border-border shadow-soft p-4 flex items-center justify-between hover:border-primary/40 transition cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-sm">Cancha {reserva.turno.cancha.nro_cancha}</div>
                    <div className="text-xs text-muted-foreground">
                      {reserva.turno.fecha.slice(0, 10)} - {reserva.turno.hora}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{reserva.turno.estado_turno}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>Actualiza tus datos deportivos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input id="ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Input id="categoria" type="number" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="telefono">Telefono</Label>
              <Input id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={guardarEdicion} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EvaluacionSheet
        partido={partidoSeleccionado}
        open={!!partidoSeleccionado}
        onClose={() => setPartidoSeleccionado(null)}
      />
    </AppShell>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <Icon className="size-3.5 text-muted-foreground" />
      <div className="text-sm font-bold mt-1">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function getInitials(value: string) {
  const parts = value
    .replace(/@.*/, "")
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "U";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
