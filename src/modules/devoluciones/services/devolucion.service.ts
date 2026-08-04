import { prisma } from '@/lib/prisma';
import { CreateDevolucionDto } from '../dto/create-devolucion.dto';

export class DevolucionService {
  /** List all devoluciones */
  static async findAll() {
    return prisma.devolucion.findMany({
      orderBy: { id: 'desc' },
      include: { items: true },
    });
  }

  /** Create a new devolucion */
  static async create(data: CreateDevolucionDto, usuarioId: number, usuarioNombre: string) {
    return prisma.$transaction(async (tx) => {
      // Generate sequential number similar to cotizaciones
      const cfg = await tx.config.findUnique({ where: { clave: 'numero_siguiente_devolucion' } });
      const num = parseInt(cfg?.valor || '1');
      const numero = `DEV-${String(num).padStart(6, '0')}`;

      const devolucion = await tx.devolucion.create({
        data: {
          numero,
          clienteNombre: data.clienteNombre.trim(),
          clienteDireccion: data.clienteDireccion || null,
          clienteTelefono: data.clienteTelefono || null,
          clienteNit: data.clienteNit || 'CF',
          atencion: data.atencion || null,
          formaPago: data.formaPago || null,
          descripcion: data.descripcion || null,
          notas: data.notas || null,
          subtotal: data.subtotal,
          descuento: data.descuento,
          total: data.total,
          validezDias: data.validezDias,
          tiempoInstalacion: data.tiempoInstalacion || null,
          usuarioId,
          usuarioNombre,
          items: {
            create: data.items.map((item) => ({
              codigo: item.codigo || '',
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.subtotal,
              totalItem: item.totalItem,
            })),
          },
        },
        include: { items: true },
      });

      // Increment the counter
      await tx.config.upsert({
        where: { clave: 'numero_siguiente_devolucion' },
        update: { valor: String(num + 1) },
        create: { clave: 'numero_siguiente_devolucion', valor: String(num + 1) },
      });

      return devolucion;
    });
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
