// Event-Driven Inventory State Engine for WebSoft POS
// Manages states: disponible -> reservado -> entregado -> consumido -> devuelto

import { prisma } from '@/lib/prisma';
import { InventoryItemStatus, InventoryItemMovement, InventoryStateTransaction } from './InventoryTypes';

export class InventoryStateEngine {
  /**
   * Reserves stock when a sale/quote is created (VentaCreada).
   * State: disponible -> reservado
   */
  static async reserveStock(
    items: InventoryItemMovement[],
    referencia: string,
    usuarioNombre: string = 'Sistema'
  ): Promise<InventoryStateTransaction[]> {
    const transactions: InventoryStateTransaction[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (!item.productoId || item.cantidad <= 0) continue;
        const prod = await tx.producto.findUnique({ where: { id: item.productoId } });
        if (!prod) continue;

        // Create Kardex entry for reservation
        await tx.kardex.create({
          data: {
            productoId: item.productoId,
            tipo: 'SALIDA_RESERVA',
            cantidad: item.cantidad,
            stockAnterior: prod.stock,
            stockNuevo: prod.stock, // Stock is reserved, physical deduction on delivery/consumption
            motivo: `Reserva de stock (${referencia})`,
            usuarioNombre,
          },
        });

        const txRecord: InventoryStateTransaction = {
          id: `INV-RES-${item.productoId}-${Date.now()}`,
          productoId: item.productoId,
          cantidad: item.cantidad,
          estadoAnterior: 'disponible',
          estadoNuevo: 'reservado',
          referencia,
          motivo: 'Reserva automática por VentaCreada',
          usuarioNombre,
          timestamp: new Date(),
        };

        await tx.auditLog.create({
          data: {
            usuarioId: 1,
            usuarioNombre,
            accion: 'INVENTARIO_RESERVADO',
            tabla: 'productos',
            registroId: String(item.productoId),
            detalle: JSON.stringify(txRecord),
          },
        });

        transactions.push(txRecord);
      }
    });

    return transactions;
  }

  /**
   * Delivers/Consumes stock when an invoice is issued (FacturaEmitida).
   * State: reservado -> entregado / consumido
   */
  static async deliverStock(
    items: InventoryItemMovement[],
    referencia: string,
    usuarioNombre: string = 'Sistema'
  ): Promise<InventoryStateTransaction[]> {
    const transactions: InventoryStateTransaction[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (!item.productoId || item.cantidad <= 0) continue;
        const prod = await tx.producto.findUnique({ where: { id: item.productoId } });
        if (!prod) continue;

        // Perform physical stock deduction upon delivery/invoice issue if not yet deducted
        const newStock = Math.max(0, prod.stock - item.cantidad);
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stock: newStock },
        });

        await tx.kardex.create({
          data: {
            productoId: item.productoId,
            tipo: 'SALIDA',
            cantidad: item.cantidad,
            stockAnterior: prod.stock,
            stockNuevo: newStock,
            motivo: `Entrega/Facturación (${referencia})`,
            usuarioNombre,
          },
        });

        const txRecord: InventoryStateTransaction = {
          id: `INV-DEL-${item.productoId}-${Date.now()}`,
          productoId: item.productoId,
          cantidad: item.cantidad,
          estadoAnterior: 'reservado',
          estadoNuevo: 'entregado',
          referencia,
          motivo: 'Entrega/Consumo por FacturaEmitida',
          usuarioNombre,
          timestamp: new Date(),
        };

        await tx.auditLog.create({
          data: {
            usuarioId: 1,
            usuarioNombre,
            accion: 'INVENTARIO_ENTREGADO',
            tabla: 'productos',
            registroId: String(item.productoId),
            detalle: JSON.stringify(txRecord),
          },
        });

        transactions.push(txRecord);
      }
    });

    return transactions;
  }

  /**
   * Releases or Returns stock when a project/sale is cancelled (ProyectoCancelado).
   * State: reservado / entregado -> devuelto / disponible
   */
  static async releaseOrReturnStock(
    items: InventoryItemMovement[],
    referencia: string,
    usuarioNombre: string = 'Sistema'
  ): Promise<InventoryStateTransaction[]> {
    const transactions: InventoryStateTransaction[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (!item.productoId || item.cantidad <= 0) continue;
        const prod = await tx.producto.findUnique({ where: { id: item.productoId } });
        if (!prod) continue;

        const newStock = prod.stock + item.cantidad;
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stock: newStock },
        });

        await tx.kardex.create({
          data: {
            productoId: item.productoId,
            tipo: 'ENTRADA',
            cantidad: item.cantidad,
            stockAnterior: prod.stock,
            stockNuevo: newStock,
            motivo: `Devolución/Liberación (${referencia})`,
            usuarioNombre,
          },
        });

        const txRecord: InventoryStateTransaction = {
          id: `INV-RET-${item.productoId}-${Date.now()}`,
          productoId: item.productoId,
          cantidad: item.cantidad,
          estadoAnterior: 'reservado',
          estadoNuevo: 'devuelto',
          referencia,
          motivo: 'Devolución/Liberación por ProyectoCancelado',
          usuarioNombre,
          timestamp: new Date(),
        };

        await tx.auditLog.create({
          data: {
            usuarioId: 1,
            usuarioNombre,
            accion: 'INVENTARIO_DEVUELTO',
            tabla: 'productos',
            registroId: String(item.productoId),
            detalle: JSON.stringify(txRecord),
          },
        });

        transactions.push(txRecord);
      }
    });

    return transactions;
  }
}
