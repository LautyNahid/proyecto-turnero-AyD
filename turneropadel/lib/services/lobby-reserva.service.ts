import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import * as repo from "@/lib/repositories/lobby.repository";

type ConfirmarLobbyInput = { id_lobby: number; id_turno: number };
type ConfirmarLobbyResult = { ok: boolean; error?: string };

export async function confirmarLobby(
  input: ConfirmarLobbyInput
): Promise<ConfirmarLobbyResult> {
  const { id_lobby, id_turno } = input;

  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    return { ok: false, error: "No se pudo obtener token de autenticación" };
  }
  
  const baseUrl = process.env.INTERNAL_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("INTERNAL_API_BASE_URL no configurada");
  }

  const resp = await fetch(`${baseUrl}/api/reserva`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id_lobby, id_turno }),
  });

  if (!resp.ok) {
    return { ok: false, error: `Par1 respondió ${resp.status} al confirmar reserva` };
  }

  const reserva = await resp.json();
  await repo.confirmarLobbyConReserva(db, id_lobby, reserva.id_reserva);

  return { ok: true };
}