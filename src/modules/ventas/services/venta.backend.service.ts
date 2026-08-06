import { prisma } from '@/lib/prisma';

export class VentaBackendService {
  static async getVentaById(id: number) {
    const venta = await prisma.venta.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!venta) throw new Error('No encontrado');
    return venta;
  }

  static async anularVenta(id: number, motivo: string, user: any) {
    const venta = await prisma.venta.findUnique({ where: { id }, include: { items: true } });
    if (!venta) throw new Error('No encontrado');
    if (venta.estado === 'anulada') throw new Error('Ya anulada');

    await prisma.$transaction(async (tx) => {
      await tx.venta.update({ where: { id: venta.id }, data: { estado: 'anulada', notas: motivo } });

      // Restore stock
      for (const item of venta.items) {
        if (!item.productoId) continue;
        const prod = await tx.producto.findUnique({ where: { id: item.productoId } });
        if (prod) {
          const newStock = prod.stock + item.cantidad;
          await tx.producto.update({ where: { id: item.productoId }, data: { stock: newStock } });
          await tx.kardex.create({
            data: {
              productoId: item.productoId,
              tipo: 'entrada',
              cantidad: item.cantidad,
              stockAntes: prod.stock,
              stockDespues: newStock,
              motivo: `Anulación venta ${venta.numero}`,
              referencia: venta.numero,
              usuarioId: parseInt(user.id),
              usuarioNombre: user.name,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          usuarioId: parseInt(user.id),
          usuarioNombre: user.name,
          accion: 'ANULAR',
          tabla: 'ventas',
          registroId: String(venta.id),
          detalle: `Anulación venta ${venta.numero}: ${motivo}`,
        },
      });
    });
  }
}
