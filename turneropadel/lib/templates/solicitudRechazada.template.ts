import { DatosReservaMail } from "@/lib/types";

export function solicitudRechazadaTemplate(datos: DatosReservaMail) {

  const subject = "🎾 Actualización sobre tu solicitud de partido";

  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #a3e635; background-color: #1a1a1a; padding: 10px 20px; border-radius: 8px;">SalePadel</h2>
      <h3>¡Hola ${datos.nombreJugador}!</h3>
      <p>Queríamos avisarte que, lamentablemente, tu solicitud para unirte al partido en <strong>ComplejoPadel</strong> no pudo ser aceptada (es posible que el cupo ya se haya llenado).</p>
      
      <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 5px 0;"><strong>📅 Fecha y Hora:</strong> ${datos.fechaReserva}</p>
        <p style="margin: 5px 0;"><strong>🏟️ Cancha:</strong> ${datos.nombreCancha}</p>
      </div>

      <p>¡Pero no te desanimes! Hay muchos otros jugadores buscando completar sus reservas en este momento.</p>
      <p>Ingresá a la plataforma para buscar nuevos partidos abiertos o, mejor aún, <strong>armá tu propio lobby</strong> y sé vos quien invite.</p>
    </div>
  `;

  return {
    subject,
    html,
  };
}