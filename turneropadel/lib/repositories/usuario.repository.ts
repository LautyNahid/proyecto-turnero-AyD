import type { Usuario } from "@prisma/client";
import { db } from "@/lib/db";

export type UpdateUsuarioData = {
  telefono?: string;
};

export interface UsuarioRepository {
  findById(id_usuario: string): Promise<Usuario | null>;
  update(id_usuario: string, data: UpdateUsuarioData): Promise<Usuario>;
}

export class PrismaUsuarioRepository implements UsuarioRepository {
  findById(id_usuario: string) {
    return db.usuario.findUnique({ where: { id_usuario } });
  }

  update(id_usuario: string, data: UpdateUsuarioData) {
    return db.usuario.update({ where: { id_usuario }, data });
  }
}

export const usuarioRepository = new PrismaUsuarioRepository();