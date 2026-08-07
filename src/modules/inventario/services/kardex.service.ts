// src/modules/inventario/services/kardex.service.ts

import { prisma } from '@/lib/prisma';
import { KardexRepository } from '../repositories/kardex.repository';
import { AjusteStockDto } from '../dto/ajuste-stock.dto';
import { Kardex } from '../types/kardex';

export class KardexService {
  private repo = new KardexRepository();

  async getKardexByProductoId(productoId: number, limit = 100): Promise<Kardex[]> {
    return this.repo.findByProductoId(productoId, limit);
  }

  async aplicarAjuste(dto: AjusteStockDto, usuarioId: number, usuarioNombre: string): Promise<{ ok: boolean; newStock: number }> {
    const prod = await prisma.producto.findUnique({ where: { id: dto.productoId } });
    if (!prod) {
      throw new Error('Producto no encontrado');
    }

    const newStock = dto.tipo === 'entrada' 
      ? prod.stock + dto.cantidad 
      : Math.max(0, prod.stock - dto.cantidad);

    await prisma.$transaction([
      prisma.producto.update({ 
        where: { id: prod.id }, 
        data: { stock: newStock } 
      }),
      prisma.kardex.create({ 
        data: { 
          productoId: prod.id, 
          tipo: dto.tipo, 
          cantidad: dto.cantidad, 
          stockAntes: prod.stock, 
          stockDespues: newStock, 
          motivo: dto.motivo, 
          usuarioId: usuarioId, 
          usuarioNombre: usuarioNombre 
        } 
      }),
    ]);

    return { ok: true, newStock };
  }
}
