// src/modules/inventario/repositories/kardex.repository.ts

import { prisma } from '@/lib/prisma';
import { Kardex } from '../types/kardex';

export class KardexRepository {
  async findByProductoId(productoId: number, limit = 100): Promise<Kardex[]> {
    return prisma.kardex.findMany({
      where: { productoId },
      orderBy: { id: 'desc' },
      take: limit,
    });
  }

  async createAjuste(data: Omit<Kardex, 'id' | 'fecha' | 'producto' | 'usuario'>): Promise<Kardex> {
    return prisma.kardex.create({
      data: data as any,
    });
  }
}
