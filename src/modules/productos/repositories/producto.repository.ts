// src/modules/productos/repositories/producto.repository.ts

import { prisma } from '@/lib/prisma';
import { Producto } from '../types/producto';

export interface FindProductosParams {
  buscar?: string;
  categoria?: string;
  limit?: number;
  soloActivos?: boolean;
}

export class ProductoRepository {
  async findAll(params?: FindProductosParams): Promise<Producto[]> {
    const where: any = {};
    
    if (params?.soloActivos !== false) {
      where.activo = true;
    }

    if (params?.categoria) {
      where.categoria = params.categoria;
    }

    if (params?.buscar) {
      const term = params.buscar.trim();
      if (term) {
        where.OR = [
          { nombre: { contains: term, mode: 'insensitive' } },
          { codigo: { contains: term, mode: 'insensitive' } },
          { descripcion: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    return prisma.producto.findMany({
      where,
      orderBy: { nombre: 'asc' },
      take: params?.limit || undefined,
    });
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
