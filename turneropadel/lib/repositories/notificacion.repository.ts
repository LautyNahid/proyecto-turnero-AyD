import { db } from "@/lib/db";
import { EstadoNotificacion, TipoNotificacion } from "@prisma/client";

export interface CrearNotificacionInput {
  id_destinatario: string;
  tipo: TipoNotificacion;
}

export class NotificacionRepository {
  listarPorUsuario(id_usuario: string) {
    return db.notificacion.findMany({
      where: { id_destinatario: id_usuario },
      orderBy: { creada_en: "desc" },
    });
  }

  buscarPorId(id_notificacion: number) {
    return db.notificacion.findUnique({
      where: { id_notificacion },
    });
  }

  crear(input: CrearNotificacionInput) {
    return db.notificacion.create({
      data: {
        id_destinatario: input.id_destinatario,
        tipo: input.tipo,
        estado: EstadoNotificacion.Pendiente,
        intentos: 0,
      },
    });
  }

  crearVarias(inputs: CrearNotificacionInput[]) {
    return db.notificacion.createMany({
      data: inputs.map((i) => ({
        id_destinatario: i.id_destinatario,
        tipo: i.tipo,
        estado: EstadoNotificacion.Pendiente,
        intentos: 0,
      })),
    });
  }

  marcarLeida(id_notificacion: number) {
    return db.notificacion.update({
      where: { id_notificacion },
      data: { estado: EstadoNotificacion.Enviada },
    });
  }
}

export const notificacionRepository = new NotificacionRepository();