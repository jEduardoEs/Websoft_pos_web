import { prisma } from '@/lib/prisma';
import { CreateCotizacionDto } from '../dto/create-cotizacion.dto';

export class CotizacionService {
  /**
   * List all quotations
   */
  static async findAll() {
    return prisma.cotizacion.findMany({
      orderBy: { id: 'desc' },
      take: 100,
      include: { items: true },
    });
  }

  /**
   * Find a specific quotation by ID
   */
  static async findById(id: number) {
    return prisma.cotizacion.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  /**
   * Create a new quotation
   */
  static async create(data: CreateCotizacionDto, usuarioId: number, usuarioNombre: string) {
    return prisma.$transaction(async (tx) => {
      // Get the next sequence number for the quotation
      const cfg = await tx.config.findUnique({ where: { clave: 'numero_siguiente_cotizacion' } });
      const num = parseInt(cfg?.valor || '1');
      const numero = `COT-${String(num).padStart(6, '0')}`;

      // Create the quotation
      const cotizacion = await tx.cotizacion.create({
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
              descuento: item.descuento,
              totalItem: item.totalItem,
            })),
          },
        },
        include: { items: true },
      });

      // Increment sequence
      await tx.config.upsert({
        where: { clave: 'numero_siguiente_cotizacion' },
        update: { valor: String(num + 1) },
        create: { clave: 'numero_siguiente_cotizacion', valor: String(num + 1) },
      });

      // Auto-save client as prospect if valid
      if (data.clienteNombre && data.clienteNombre !== 'Consumidor Final') {
        const existente = await tx.cliente.findFirst({
          where: {
            OR: [
              data.clienteTelefono ? { telefono: data.clienteTelefono } : { nombre: data.clienteNombre },
              data.clienteNit && data.clienteNit !== 'CF' ? { nit: data.clienteNit } : { nombre: data.clienteNombre },
            ],
          },
        });
        
        if (!existente) {
          await tx.cliente.create({
            data: {
              nombre: data.clienteNombre.trim(),
              nit: data.clienteNit || 'CF',
              telefono: data.clienteTelefono || null,
              direccion: data.clienteDireccion || null,
              notas: `Prospecto desde cotización ${numero}`,
            },
          });
        }
      }

      return cotizacion;
    });
  }

  /**
   * Update quotation status (e.g. accepted, voided)
   */
  static async updateEstado(id: number, estado: string) {
    return prisma.cotizacion.update({
      where: { id },
      data: { estado },
    });
  }
}
