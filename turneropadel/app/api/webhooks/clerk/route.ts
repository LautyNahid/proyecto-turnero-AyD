import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/types";

type ClerkUserCreatedEvent = {
  type: "user.created";
  data: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone_numbers: { phone_number: string }[];
    email_addresses: { email_address: string }[];
    primary_email_address_id: string;
    primary_phone_number_id: string | null;
  };
};

type ClerkUserDeletedEvent = {
  type: "user.deleted";
  data: { id: string };
};

type ClerkEvent = ClerkUserCreatedEvent | ClerkUserDeletedEvent;

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(fail("CLERK_WEBHOOK_SECRET no configurado"), { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(fail("Headers de webhook faltantes"), { status: 400 });
  }

  const payload = await req.text();

  let event: ClerkEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch {
    return NextResponse.json(fail("Firma de webhook inválida"), { status: 400 });
  }

  if (event.type === "user.created") {
    const { id, first_name, last_name, email_addresses, phone_numbers, primary_email_address_id, primary_phone_number_id } = event.data;

    const correo = email_addresses.find((e) => e.email_address)?.email_address ?? "";
    const telefono = phone_numbers.find((p) => p.phone_number)?.phone_number ?? "";

    try {
      await db.usuario.create({
        data: {
          id_usuario: id,
          nombre: first_name ?? "",
          apellido: last_name ?? "",
          correo_electronico: correo,
          telefono,
          jugador: {
            create: {
              categoria: 1,
              ciudad: "",
            },
          },
        },
      });
    } catch (e) {
      console.error("[webhook/clerk] Error al crear usuario:", e);
      return NextResponse.json(fail("Error al sincronizar usuario"), { status: 500 });
    }
  }

  if (event.type === "user.deleted") {
    try {
      await db.usuario.delete({ where: { id_usuario: event.data.id } });
    } catch (e) {
      console.error("[webhook/clerk] Error al eliminar usuario:", e);
    }
  }

  return NextResponse.json(ok(null));
}