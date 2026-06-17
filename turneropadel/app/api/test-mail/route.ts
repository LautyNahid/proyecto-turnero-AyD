import { NextResponse } from "next/server";
import { MailService } from "@/lib/services/mail.service";

export async function GET(request: Request) {
  try {
    // Acá pongan un correo real de ustedes para recibir la prueba
    const emailDestino = "tomas.totaro@gmail.com";

    await MailService.enviarConfirmacionReserva(
      emailDestino,
      "Jugador de Prueba",
      "25 de Junio, 18:00 hs",
      "Cancha 1 - Cristal",
    );

    return NextResponse.json({
      message: "¡Email de prueba enviado con éxito!",
    });
  } catch (error) {
    console.error("Error en test-mail:", error);
    return NextResponse.json({ error: "Falló el envío" }, { status: 500 });
  }
}
