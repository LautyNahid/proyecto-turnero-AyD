import { MailService } from "@/lib/services/mail.service";
import {
  confirmarReservaTemplate,
  cancelarReservaTemplate,
  jugadorExpulsadoTemplate,
  jugadorLobbyCanceladoTemplate,
  jugadorLobbyConfirmadoTemplate,
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

  async notificarJugadorExpulsado(email: string, datos: DatosReservaMail) {
    const mail = jugadorExpulsadoTemplate(datos);
    await this.enviar(email, mail);
  },

  async notificarLobbyCancelado(email: string, datos: DatosReservaMail) {
    const mail = jugadorLobbyCanceladoTemplate(datos);
    await this.enviar(email, mail);
  },

  async notificarLobbyConfirmado(email: string, datos: DatosReservaMail) {
    const mail = jugadorLobbyConfirmadoTemplate(datos);
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
