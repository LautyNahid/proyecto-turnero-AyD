import { DatosReservaMail } from "@/lib/types";

export function solicitudAceptadaTemplate(datos: DatosReservaMail) {

  const subject = "✅ ¡Estás adentro! Tu solicitud fue aceptada";

  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #a3e635; background-color: #1a1a1a; padding: 10px 20px; border-radius: 8px;">SalePadel</h2>
      <h3>¡Hola ${datos.nombreJugador}!</h3>
      <p>¡Excelentes noticias! El creador del partido ha <strong>aceptado tu solicitud</strong> para unirte al lobby en <strong>ComplejoPadel</strong>.</p>
      
      <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #a3e635;">
        <p style="margin: 5px 0;"><strong>📅 Fecha y Hora:</strong> ${datos.fechaReserva}</p>
        <p style="margin: 5px 0;"><strong>🏟️ Cancha:</strong> ${datos.nombreCancha}</p>
      </div>

      <p>Ya tenés tu lugar asegurado. Prepará la paleta, pasá a calentar y nos vemos directamente en la pista.</p>
      <p>¡Que tengas un excelente partido!</p>
    </div>
  `;

  return {
    subject,
    html,
  };
}