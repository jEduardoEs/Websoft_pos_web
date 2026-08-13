// src/modules/productos/repositories/producto.repository.ts

import { prisma } from '@/lib/prisma';
import { Producto } from '../types/producto';
import { buildSearchWhereClause, rankSearchResults } from '@/lib/search-utils';

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

    if (params?.buscar && params.buscar.trim()) {
      const searchWhere = buildSearchWhereClause(params.buscar, ['nombre', 'codigo', 'descripcion', 'categoria']);
      Object.assign(where, searchWhere);
    }

    let productos = await prisma.producto.findMany({
      where,
      orderBy: { nombre: 'asc' },
      take: params?.limit ? params.limit * 2 : undefined,
    });

    if (params?.buscar && params.buscar.trim()) {
      productos = rankSearchResults<Producto>(
        productos,
        params.buscar,
        (p: Producto) => `${p.codigo || ''} ${p.nombre} ${p.descripcion || ''} ${p.categoria || ''}`,
        (p: Producto) => p.codigo
      );
      if (params?.limit) {
        productos = productos.slice(0, params.limit);
      }
    }

    return productos;
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
