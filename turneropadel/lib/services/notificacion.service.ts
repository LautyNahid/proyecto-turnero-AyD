import { TipoNotificacion } from "@prisma/client";
import { notificacionRepository } from "@/lib/repositories/notificacion.repository";
import { ServiceError } from "@/lib/services/service-error";

export class NotificacionService {

  listarPorUsuario(id_usuario: string) {
    return notificacionRepository.listarPorUsuario(id_usuario);
  }

  async marcarComoLeida(idParam: string, id_usuario: string) {
    const id_notificacion = this.parseId(idParam);

    const notificacion = await notificacionRepository.buscarPorId(id_notificacion);

    if (!notificacion) {
      throw new ServiceError("Notificación no encontrada", 404);
    }

    if (notificacion.id_destinatario !== id_usuario) {
      throw new ServiceError("Sin permisos para modificar esta notificación", 403);
    }

    return notificacionRepository.marcarLeida(id_notificacion);
  }

  async notificarUno(id_destinatario: string, tipo: TipoNotificacion) {
    return notificacionRepository.crear({ id_destinatario, tipo });
  }

  async notificarVarios(ids_destinatarios: string[], tipo: TipoNotificacion) {
    return notificacionRepository.crearVarias(
      ids_destinatarios.map((id) => ({ id_destinatario: id, tipo }))
    );
  }

  private parseId(value: string): number {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
      throw new ServiceError("El id de notificación debe ser un entero positivo", 400);
    }
    return id;
  }
}

export const notificacionService = new NotificacionService();