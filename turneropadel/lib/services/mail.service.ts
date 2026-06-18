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
};
