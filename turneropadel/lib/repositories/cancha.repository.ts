import { Prisma } from "@prisma/client";
import type { Cancha } from "@prisma/client";
import { db } from "@/lib/db";

export type CreateCanchaData = {
  nro_cancha: number;
  activa?: boolean;
};

export type UpdateCanchaData = Partial<CreateCanchaData>;

export interface CanchaRepository {
  findAll(): Promise<Cancha[]>;
  findById(id_cancha: number): Promise<Cancha | null>;
  findByNumero(nro_cancha: number): Promise<Cancha | null>;
  create(data: CreateCanchaData): Promise<Cancha>;
  update(id_cancha: number, data: UpdateCanchaData): Promise<Cancha>;
  delete(id_cancha: number): Promise<Cancha>;
}

export class PrismaCanchaRepository implements CanchaRepository {
  findAll() {
    return db.cancha.findMany({
      orderBy: { nro_cancha: "asc" },
    });
  }

  findById(id_cancha: number) {
    return db.cancha.findUnique({
      where: { id_cancha },
    });
  }

  findByNumero(nro_cancha: number) {
    return db.cancha.findUnique({
      where: { nro_cancha },
    });
  }

  create(data: CreateCanchaData) {
    return db.cancha.create({
      data,
    });
  }

  update(id_cancha: number, data: UpdateCanchaData) {
    return db.cancha.update({
      where: { id_cancha },
      data,
    });
  }

  delete(id_cancha: number) {
    return db.cancha.delete({
      where: { id_cancha },
    });
  }
}

export function isKnownPrismaError(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export const canchaRepository = new PrismaCanchaRepository();
