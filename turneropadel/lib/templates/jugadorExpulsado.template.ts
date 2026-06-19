import { DatosReservaMail } from "@/lib/types";

export function jugadorExpulsadoTemplate(datos: DatosReservaMail) {
  //formateo de fecha a formato AR
  const fecha = new Date(datos.fechaReserva);
  const fechaFormateada = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(fecha);

  const subject = "❌ Expulsion de lobby";

  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #a3e635; background-color: #1a1a1a; padding: 10px 20px; border-radius: 8px;">SalePadel</h2>
      <h3>¡Hola ${datos.nombreJugador}!</h3>
      <p>Usted ha sido EXPULSADO de una lobby</p>
      <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #a3e635;">
        <p style="margin: 5px 0;"><strong>📅 Fecha y Hora:</strong> ${fechaFormateada}</p>
        <p style="margin: 5px 0;"><strong>🏟️ Cancha:</strong> ${datos.nombreCancha}</p>
      </div>
    </div>
  `;

  return {
    subject,
    html,
  };
}
