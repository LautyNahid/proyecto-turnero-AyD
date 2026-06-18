import { MailService } from "@/lib/services/mail.service";
import {
  confirmarReservaTemplate,
  cancelarReservaTemplate,
  recordatorioTurnoTemplate,
  turnoFinalizadoTemplate,
} from "@/lib/templates";
import { DatosReservaMail } from "@/lib/types";

export const NotificacionMailService = {
  async notificarReservaConfirmada(email: string, datos: DatosReservaMail) {
    const mail = confirmarReservaTemplate(datos);
    await this.enviar(email, mail);
  },

  async notificarReservaCancelada(email: string, datos: DatosReservaMail) {
    const mail = cancelarReservaTemplate(datos);
    await this.enviar(email, mail);
  },

  async notificarRecordatorioTurno(email: string, datos: DatosReservaMail) {
    const mail = recordatorioTurnoTemplate(datos);
    await this.enviar(email, mail);
  },

  async notificarTurnoFinalizado(email: string, datos: DatosReservaMail) {
    const mail = turnoFinalizadoTemplate(datos);
    await this.enviar(email, mail);
  },

  async enviar(
    email: string,
    mail: {
      subject: string;
      html: string;
    },
  ) {
    await MailService.sendMail({
      to: email,
      subject: mail.subject,
      html: mail.html,
    });
  },

  // TODO: Implementar notificarVarios iterando sobre un array de IDs
};
