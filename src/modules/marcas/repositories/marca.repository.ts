// src/modules/marcas/repositories/marca.repository.ts

import { prisma } from '@/lib/prisma';
import { Marca } from '../types/marca';

export class MarcaRepository {
  async findAll(): Promise<Marca[]> {
    return prisma.marca.findMany();
  }

  async findById(id: number): Promise<Marca | null> {
    return prisma.marca.findUnique({ where: { id } });
  }

  async create(data: Marca): Promise<Marca> {
    return prisma.marca.create({ data });
  }

  async update(id: number, data: Partial<Marca>): Promise<Marca> {
    return prisma.marca.update({ where: { id }, data });
  }

  // Soft delete: set activo = false
  async delete(id: number): Promise<Marca> {
    return prisma.marca.update({ where: { id }, data: { activo: false } });
  }
}
