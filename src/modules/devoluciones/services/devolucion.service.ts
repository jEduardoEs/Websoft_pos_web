import { prisma } from '@/lib/prisma';
import { CreateDevolucionDto } from '../dto/create-devolucion.dto';

export class DevolucionService {
  /** List all devoluciones */
  static async findAll(limit = 50) {
    return prisma.devolucion.findMany({
      orderBy: { id: 'desc' },
      take: limit,
      include: { 
        items: true,
        venta: {
          select: {
            clienteNombre: true,
            clienteNit: true
          }
        }
      },
    });
  }

  /** Create a new devolucion */
  static async create(data: CreateDevolucionDto, usuarioId: number, usuarioNombre: string) {
    return prisma.$transaction(async (tx) => {
      const devolucion = await tx.devolucion.create({
        data: {
          ventaId: data.ventaId || null,
          ventaNumero: data.ventaNumero || null,
          motivo: data.motivo,
          totalDevuelto: data.totalDevuelto,
          estado: 'pendiente', // Por defecto pendiente de aprobación
          usuarioId,
          usuarioNombre,
          items: {
            create: data.items.map((item) => ({
              productoId: item.productoId || null,
              nombre: item.nombre,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.subtotal,
            })),
          },
        },
        include: { items: true },
      });

      return devolucion;
    }, { maxWait: 10000, timeout: 30000 });
  }

  /** Approve a devolucion (change estado) */
  static async aprobar(id: number) {
    return prisma.devolucion.update({
      where: { id },
      data: { estado: 'aprobada' },
    });
  }

  /** Anular una devolucion */
  static async anular(id: number) {
    return prisma.devolucion.update({
      where: { id },
      data: { estado: 'anulada' },
    });
  }
}
