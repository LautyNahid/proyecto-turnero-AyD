"use client";

import { FormEvent, ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Edit3, Loader2, Plus, Trash2 } from "lucide-react";

type Cancha = {
  id_cancha: number;
  nro_cancha: number;
  activa: boolean;
  precio: number | null;
};

type CanchasCrudContextValue = {
  canchas: Cancha[];
  loadingCanchas: boolean;
  error: string | null;
  creatingCancha: boolean;
  editingCancha: Cancha | null;
  numeroCancha: string;
  activa: boolean;
  precio: string;
  saving: boolean;
  deletingCanchaId: number | null;
  activeCount: number;
  inactiveCount: number;
  canchaToDelete: Cancha | null;
  openCreateDialog: () => void;
  openEditDialog: (cancha: Cancha) => void;
  closeCanchaDialog: () => void;
  handleSubmitCancha: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  setNumeroCancha: (numeroCancha: string) => void;
  setActiva: (activa: boolean) => void;
  setPrecio: (precio: string) => void;
  requestDeleteCancha: (cancha: Cancha) => void;
  cancelDeleteCancha: () => void;
  confirmDeleteCancha: () => Promise<void>;
};

const CanchasCrudContext = createContext<CanchasCrudContextValue | null>(null);

function useCanchasCrud() {
  const context = useContext(CanchasCrudContext);

  if (!context) {
    throw new Error("useCanchasCrud debe usarse dentro de CanchasCrudProvider");
  }

  return context;
}

export function CanchasCrudProvider({ children }: { children: ReactNode }) {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [loadingCanchas, setLoadingCanchas] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingCancha, setCreatingCancha] = useState(false);
  const [editingCancha, setEditingCancha] = useState<Cancha | null>(null);
  const [numeroCancha, setNumeroCancha] = useState("");
  const [activa, setActiva] = useState(true);
  const [precio, setPrecio] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingCanchaId, setDeletingCanchaId] = useState<number | null>(null);
  const [canchaToDelete, setCanchaToDelete] = useState<Cancha | null>(null);

  const activeCount = useMemo(() => canchas.filter((cancha) => cancha.activa).length, [canchas]);
  const inactiveCount = canchas.length - activeCount;

  const loadCanchas = useCallback(async () => {
    try {
      const response = await fetch("/api/cancha", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudieron obtener las canchas");
      }

      setCanchas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron obtener las canchas");
    } finally {
      setLoadingCanchas(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCanchas();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadCanchas]);

  function openCreateDialog() {
    setCreatingCancha(true);
    setEditingCancha(null);
    setNumeroCancha("");
    setActiva(true);
    setPrecio("");
    setError(null);
  }

  function openEditDialog(cancha: Cancha) {
    setCreatingCancha(false);
    setEditingCancha(cancha);
    setNumeroCancha(String(cancha.nro_cancha));
    setActiva(cancha.activa);
    setPrecio(cancha.precio !== null && cancha.precio !== undefined ? String(cancha.precio) : "");
    setError(null);
  }

  function closeCanchaDialog() {
    setCreatingCancha(false);
    setEditingCancha(null);
    setPrecio("");
    setError(null);
  }

  async function handleSubmitCancha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!creatingCancha && !editingCancha) return;

    const nro_cancha = Number(numeroCancha);
    if (!Number.isInteger(nro_cancha) || nro_cancha <= 0) {
      setError("El numero de cancha debe ser un entero positivo");
      return;
    }

    const precioNum = precio !== "" ? Number(precio) : undefined;
    if (precioNum !== undefined && (isNaN(precioNum) || precioNum < 0)) {
      setError("El precio debe ser un numero mayor o igual a cero");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        editingCancha ? `/api/cancha/${editingCancha.id_cancha}` : "/api/cancha",
        {
          method: editingCancha ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nro_cancha,
            activa,
            ...(precioNum !== undefined ? { precio: precioNum } : {}),
          }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? (editingCancha ? "No se pudo modificar la cancha" : "No se pudo crear la cancha"),
        );
      }

      setCanchas((current) =>
        (editingCancha
          ? current.map((cancha) => (cancha.id_cancha === data.id_cancha ? data : cancha))
          : [...current, data]
        ).sort((a, b) => a.nro_cancha - b.nro_cancha),
      );
      closeCanchaDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la cancha");
    } finally {
      setSaving(false);
    }
  }

  function requestDeleteCancha(cancha: Cancha) {
    setCanchaToDelete(cancha);
    setError(null);
  }

  function cancelDeleteCancha() {
    setCanchaToDelete(null);
  }

  async function confirmDeleteCancha() {
    if (!canchaToDelete) return;
    const cancha = canchaToDelete;

    setDeletingCanchaId(cancha.id_cancha);
    setError(null);

    try {
      const response = await fetch(`/api/cancha/${cancha.id_cancha}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "No se pudo dar de baja la cancha");
      }

      setCanchas((current) =>
        current.map((c) => (c.id_cancha === cancha.id_cancha ? { ...c, activa: false } : c)),
      );
      setCanchaToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo dar de baja la cancha");
    } finally {
      setDeletingCanchaId(null);
    }
  }

  return (
    <CanchasCrudContext.Provider
      value={{
        canchas,
        loadingCanchas,
        error,
        creatingCancha,
        editingCancha,
        numeroCancha,
        activa,
        precio,
        saving,
        deletingCanchaId,
        activeCount,
        inactiveCount,
        canchaToDelete,
        openCreateDialog,
        openEditDialog,
        closeCanchaDialog,
        handleSubmitCancha,
        setNumeroCancha,
        setActiva,
        setPrecio,
        requestDeleteCancha,
        cancelDeleteCancha,
        confirmDeleteCancha,
      }}
    >
      {children}
      <CanchaDialog />
      <DeleteCanchaDialog />
    </CanchasCrudContext.Provider>
  );
}

export function CanchasKpi() {
  const { activeCount, canchas } = useCanchasCrud();

  return (
    <div className="rounded-2xl p-4 shadow-soft bg-card border border-border">
      <div className="text-[11px] opacity-70 font-semibold uppercase tracking-wider">Canchas activas</div>
      <div className="mt-2 text-2xl font-bold">{activeCount}/{canchas.length}</div>
    </div>
  );
}

export function CanchasCrudSection() {
  const {
    canchas,
    loadingCanchas,
    error,
    creatingCancha,
    editingCancha,
    deletingCanchaId,
    openCreateDialog,
    openEditDialog,
    requestDeleteCancha,
  } = useCanchasCrud();

  return (
    <section className="bg-card rounded-2xl border border-border shadow-soft">
      <div className="p-5 flex items-center justify-between border-b border-border">
        <div>
          <h3 className="font-bold">Canchas</h3>
          <p className="text-xs text-muted-foreground">Alta, baja y modificacion</p>
        </div>
        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold hover:opacity-90"
        >
          <Plus className="size-3.5" /> Nueva cancha
        </button>
      </div>

      {error && !editingCancha && !creatingCancha && (
        <div className="mx-5 mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="text-left p-3 pl-5">Nombre</th>
              <th className="text-left p-3">Numero</th>
              <th className="text-left p-3">Precio</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-left p-3">ID</th>
              <th className="text-right p-3 pr-5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loadingCanchas ? (
              <tr className="border-t border-border">
                <td className="p-5 text-muted-foreground" colSpan={6}>
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Cargando canchas
                  </span>
                </td>
              </tr>
            ) : canchas.length === 0 ? (
              <tr className="border-t border-border">
                <td className="p-5 text-muted-foreground" colSpan={6}>
                  No hay canchas registradas.
                </td>
              </tr>
            ) : (
              canchas.map((cancha) => (
                <tr key={cancha.id_cancha} className="border-t border-border">
                  <td className="p-3 pl-5 font-semibold">Cancha {cancha.nro_cancha}</td>
                  <td className="p-3 text-muted-foreground">{cancha.nro_cancha}</td>
                  <td className="p-3 text-muted-foreground">
                    {cancha.precio !== null && cancha.precio !== undefined
                      ? `$${cancha.precio.toLocaleString("es-AR")}`
                      : "—"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        cancha.activa
                          ? "bg-success/15 text-success"
                          : "bg-warning/20 text-warning-foreground"
                      }`}
                    >
                      {cancha.activa ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="p-3 font-semibold">#{cancha.id_cancha}</td>
                  <td className="p-3 text-right pr-5 space-x-1">
                    <button
                      type="button"
                      onClick={() => openEditDialog(cancha)}
                      className="size-8 rounded-lg hover:bg-muted inline-flex items-center justify-center text-muted-foreground"
                      aria-label={`Editar cancha ${cancha.nro_cancha}`}
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDeleteCancha(cancha)}
                      disabled={deletingCanchaId === cancha.id_cancha || !cancha.activa}
                      className="size-8 rounded-lg hover:bg-destructive/10 inline-flex items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-50"
                      aria-label={`Dar de baja cancha ${cancha.nro_cancha}`}
                      title={!cancha.activa ? "La cancha ya está inactiva" : undefined}
                    >
                      {deletingCanchaId === cancha.id_cancha ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CanchaDialog() {
  const {
    creatingCancha,
    editingCancha,
    error,
    numeroCancha,
    activa,
    precio,
    saving,
    closeCanchaDialog,
    handleSubmitCancha,
    setNumeroCancha,
    setActiva,
    setPrecio,
  } = useCanchasCrud();

  return (
    <Dialog
      open={creatingCancha || editingCancha !== null}
      onOpenChange={(open) => !open && closeCanchaDialog()}
    >
      <DialogContent>
        <form onSubmit={handleSubmitCancha} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{editingCancha ? "Editar cancha" : "Nueva cancha"}</DialogTitle>
            <DialogDescription>
              {editingCancha
                ? "Los cambios se guardan en la base de datos."
                : "La cancha se crea en la base de datos."}
            </DialogDescription>
          </DialogHeader>

          {error && (editingCancha || creatingCancha) && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nro_cancha">Numero de cancha</Label>
            <Input
              id="nro_cancha"
              type="number"
              min={1}
              step={1}
              value={numeroCancha}
              onChange={(event) => setNumeroCancha(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="precio">Precio base (opcional)</Label>
            <Input
              id="precio"
              type="number"
              min={0}
              step={0.01}
              placeholder="Ej: 4500"
              value={precio}
              onChange={(event) => setPrecio(event.target.value)}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Se aplica a los turnos futuros disponibles de esta cancha.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <div>
              <Label htmlFor="activa">Activa</Label>
              <p className="text-xs text-muted-foreground">Disponible para operar en el complejo.</p>
            </div>
            <Switch id="activa" checked={activa} onCheckedChange={setActiva} disabled={saving} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeCanchaDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editingCancha ? "Guardar cambios" : "Crear cancha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCanchaDialog() {
  const { canchaToDelete, error, deletingCanchaId, cancelDeleteCancha, confirmDeleteCancha } =
    useCanchasCrud();

  return (
    <Dialog open={canchaToDelete !== null} onOpenChange={(open) => !open && cancelDeleteCancha()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dar de baja cancha</DialogTitle>
          <DialogDescription>
            {canchaToDelete &&
              `¿Dar de baja la cancha ${canchaToDelete.nro_cancha}? Quedará inactiva pero no se eliminará.`}
          </DialogDescription>
        </DialogHeader>

        {error && canchaToDelete && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={cancelDeleteCancha}
            disabled={deletingCanchaId !== null}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void confirmDeleteCancha()}
            disabled={deletingCanchaId !== null}
          >
            {deletingCanchaId !== null && <Loader2 className="size-4 animate-spin" />}
            Dar de baja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}