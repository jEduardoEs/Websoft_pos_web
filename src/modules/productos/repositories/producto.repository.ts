// src/modules/productos/repositories/producto.repository.ts

import { prisma } from '@/lib/prisma';
import { Producto } from '../types/producto';

export class ProductoRepository {
  async findAll(): Promise<Producto[]> {
    return prisma.producto.findMany();
  }

  async findById(id: number): Promise<Producto | null> {
    return prisma.producto.findUnique({ where: { id } });
  }

  async create(data: Omit<Producto, 'id' | 'createdAt'>): Promise<Producto> {
    return prisma.producto.create({ data: data as any });
  }

  async update(id: number, data: Partial<Producto>): Promise<Producto> {
    return prisma.producto.update({ where: { id }, data });
  }

  // Soft delete: set activo = false
  async delete(id: number): Promise<Producto> {
    return prisma.producto.update({ where: { id }, data: { activo: false } });
  }
}
