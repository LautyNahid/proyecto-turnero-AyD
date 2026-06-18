import { DatosReservaMail } from "@/lib/types";

export function turnoFinalizadoTemplate(datos: DatosReservaMail) {
  // Formateo de fecha a formato AR
  const fecha = new Date(datos.fechaReserva);
  const fechaFormateada = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(fecha);

  const subject = "🍻 ¡Tercer tiempo! ¿Cómo estuvo el partido?";

  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #a3e635; background-color: #1a1a1a; padding: 10px 20px; border-radius: 8px;">SalePadel</h2>
      <h3>¡Hola ${datos.nombreJugador}!</h3>
      <p>Esperamos que hayas dejado todo en la cancha y hayas disfrutado tu partido en <strong>Complejo Bahiense</strong>.</p>
      
      <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #a3e635;">
        <p style="margin: 5px 0;"><strong>📅 Jugado el:</strong> ${fechaFormateada}</p>
        <p style="margin: 5px 0;"><strong>🏟️ Cancha:</strong> ${datos.nombreCancha}</p>
      </div>

      <p>Recordá ingresar a la plataforma para evaluar el nivel de tus compañeros y rivales. ¡Tu feedback ayuda a mantener la comunidad confiable y competitiva!</p>
      
      <p>¿Con ganas de revancha? Ya podés ir organizando tu próximo turno.</p>
    </div>
  `;

  return {
    subject,
    html,
  };
}