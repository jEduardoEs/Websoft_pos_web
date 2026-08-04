// src/modules/categorias/repositories/categoria.repository.ts

import { prisma } from '@/lib/prisma';
import { Categoria } from '../types/categoria';

export class CategoriaRepository {
  async findAll(): Promise<Categoria[]> {
    return prisma.categoria.findMany();
  }

  async findById(id: number): Promise<Categoria | null> {
    return prisma.categoria.findUnique({ where: { id } });
  }

  async create(data: Categoria): Promise<Categoria> {
    return prisma.categoria.create({ data });
  }

  async update(id: number, data: Partial<Categoria>): Promise<Categoria> {
    return prisma.categoria.update({ where: { id }, data });
  }

  async delete(id: number): Promise<Categoria> {
    // Soft delete: set activo = false
    return prisma.categoria.update({ where: { id }, data: { activo: false } });
  }
}
