import { prisma } from '@/lib/prisma';

export class GarantiaBackendService {
  static async findAll(params: { buscar?: string; estado?: string }) {
    const { buscar, estado } = params;

    const where: any = {};
    if (estado) where.estado = estado;
    if (buscar) {
      where.OR = [
        { clienteNombre: { contains: buscar, mode: 'insensitive' } },
        { productoNombre: { contains: buscar, mode: 'insensitive' } },
        { numero: { contains: buscar, mode: 'insensitive' } },
        { clienteNit: { contains: buscar, mode: 'insensitive' } },
      ];
    }

    // Auto-update expired
    await prisma.garantia.updateMany({
      where: { estado: 'vigente', fechaVencimiento: { lt: new Date() } },
      data: { estado: 'vencida' },
    });

    return prisma.garantia.findMany({ where, orderBy: { id: 'desc' }, take: 100 });
  }

  static async create(data: any, userName: string) {
    if (!data.clienteNombre || !data.productoNombre) {
      throw new Error('Cliente y producto son requeridos');
    }

    const count = await prisma.garantia.count();
    const numero = `GAR-${String(count + 1).padStart(6, '0')}`;
    const fVenta = data.fechaVenta ? new Date(data.fechaVenta) : new Date();
    const dias = +data.diasGarantia || 365;
    const fVencimiento = new Date(fVenta.getTime() + dias * 24 * 60 * 60 * 1000);

    let resolvedProyectoId: number | null = data.proyectoId ? Number(data.proyectoId) : null;
    if (!resolvedProyectoId) {
      const proyecto = await prisma.proyecto.findFirst({
        where: {
          OR: [
            data.ventaNumero ? { cotizacionNumero: data.ventaNumero } : {},
            data.ventaNumero ? { numero: data.ventaNumero } : {},
            data.clienteNombre ? { clienteNombre: { contains: data.clienteNombre, mode: 'insensitive' } } : {},
          ].filter(c => Object.keys(c).length > 0),
        },
        orderBy: { createdAt: 'desc' },
      });
      if (proyecto) resolvedProyectoId = proyecto.id;
    }

    return prisma.garantia.create({
      data: {
        numero,
        clienteNombre: data.clienteNombre,
        clienteTelefono: data.clienteTelefono,
        clienteNit: data.clienteNit,
        productoNombre: data.productoNombre,
        productoSerie: data.productoSerie,
        ventaNumero: data.ventaNumero,
        ventaId: data.ventaId ? Number(data.ventaId) : null,
        proyectoId: resolvedProyectoId,
        diasGarantia: dias,
        fechaVenta: fVenta,
        fechaVencimiento: fVencimiento,
        condiciones: data.condiciones,
        notas: data.notas,
        usuarioNombre: userName,
      },
    });
  }

  static async findById(id: number) {
    return prisma.garantia.findUnique({
      where: { id },
      include: { reclamos: true },
    });
  }

  static async update(id: number, data: any) {
    const d: any = { ...data };
    if (d.fechaVenta) d.fechaVenta = new Date(d.fechaVenta);
    if (d.fechaVencimiento) d.fechaVencimiento = new Date(d.fechaVencimiento);

    return prisma.garantia.update({
      where: { id },
      data: d,
    });
  }

  static async delete(id: number, role: string) {
    if (role !== 'admin' && role !== 'supervisor') {
      throw new Error('No autorizado');
    }
    await prisma.garantia.delete({ where: { id } });
  }
}
