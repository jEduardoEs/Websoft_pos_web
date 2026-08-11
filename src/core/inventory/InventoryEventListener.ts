// Event listener for Inventory State Engine
// Automatically connects domain events (SaleCreated, VentaCreada, FacturaEmitida, ProyectoCancelado) to inventory state transitions.

import { eventBus } from '@/core/events/EventBus';
import { prisma } from '@/lib/prisma';
import { InventoryStateEngine } from './InventoryStateEngine';

export function registerInventoryEventListeners(): void {
  const processSaleCreated = async (event: any) => {
    const { saleId, ventaId, usuarioNombre } = event.payload || {};
    const id = Number(saleId || ventaId);
    if (!id) return;

    try {
      const venta = await prisma.venta.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!venta) return;

      const items = venta.items
        .filter(i => Boolean(i.productoId))
        .map(i => ({ productoId: i.productoId!, cantidad: i.cantidad }));

      if (items.length > 0) {
        await InventoryStateEngine.reserveStock(items, `Venta ${venta.numero}`, usuarioNombre || 'Sistema');
      }
    } catch (err) {
      console.error('[InventoryEventListener] Error processing sale event:', err);
    }
  };

  // 1. Event SaleCreated & VentaCreada: Transition Disponible -> Reservado
  eventBus.subscribe('SaleCreated', processSaleCreated);
  eventBus.subscribe('VentaCreada', processSaleCreated);

  // 2. Event FacturaEmitida: Transition Reservado -> Entregado / Consumido
  eventBus.subscribe('FacturaEmitida', async (event: any) => {
    const { ventaId, numeroFactura, usuarioNombre } = event.payload || {};
    if (!ventaId) return;

    try {
      const venta = await prisma.venta.findUnique({
        where: { id: Number(ventaId) },
        include: { items: true },
      });
      if (!venta) return;

      const items = venta.items
        .filter(i => Boolean(i.productoId))
        .map(i => ({ productoId: i.productoId!, cantidad: i.cantidad }));

      if (items.length > 0) {
        await InventoryStateEngine.deliverStock(items, `Factura ${numeroFactura || venta.numero}`, usuarioNombre || 'Sistema');
      }
    } catch (err) {
      console.error('[InventoryEventListener] Error on FacturaEmitida:', err);
    }
  });

  // 3. Event ProyectoCancelado: Transition Reservado/Entregado -> Devuelto
  eventBus.subscribe('ProyectoCancelado', async (event: any) => {
    const { proyectoId, numero, usuarioNombre } = event.payload || {};
    if (!proyectoId) return;

    try {
      const proyecto = await prisma.proyecto.findUnique({
        where: { id: Number(proyectoId) },
      });
      if (!proyecto || !proyecto.cotizacionId) return;

      const cotizacion = await prisma.cotizacion.findUnique({
        where: { id: proyecto.cotizacionId },
        include: { items: true },
      });
      if (!cotizacion) return;

      const items = cotizacion.items
        .filter(i => Boolean(i.productoId))
        .map(i => ({ productoId: i.productoId!, cantidad: i.cantidad }));

      if (items.length > 0) {
        await InventoryStateEngine.releaseOrReturnStock(items, `Proyecto ${numero || proyecto.numero}`, usuarioNombre || 'Sistema');
      }
    } catch (err) {
      console.error('[InventoryEventListener] Error on ProyectoCancelado:', err);
    }
  });

  console.info('[Inventory] Event listeners registered successfully.');
}
