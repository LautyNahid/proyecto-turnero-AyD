import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", //true obligatorio
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export const MailService = {
  async sendMail({ to, subject, html }: MailOptions) {
    try {
      const info = await transporter.sendMail({
        from: `"SalePadel" <${process.env.SMTP_FROM}>`,
        to,
        subject,
        html,
      });
      console.log(`Email enviado exitosamente a ${to} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("[MailService] Error enviando email:", error);
      throw new Error("Fallo al enviar el correo electrónico");
    }
  },

  async enviarConfirmacionReserva(
    email: string,
    nombreUsuario: string,
    fechaReserva: string,
    nombreCancha: string,
  ) {
    const subject = "¡Tu reserva en Milanno está confirmada! 🎾";

    const html = `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #a3e635; background-color: #1a1a1a; padding: 10px 20px; border-radius: 8px;">SalePadel</h2>
        <h3>¡Hola ${nombreUsuario}!</h3>
        <p>Tu reserva en el complejo <strong>Milanno</strong> ha sido confirmada con éxito.</p>
        <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #a3e635;">
          <p style="margin: 5px 0;"><strong>📅 Fecha y Hora:</strong> ${fechaReserva}</p>
          <p style="margin: 5px 0;"><strong>🏟️ Cancha:</strong> ${nombreCancha}</p>
        </div>
        <p>¡Prepará la paleta y nos vemos en la cancha!</p>
      </div>
    `;

    return this.sendMail({ to: email, subject, html });
  },
};
