import { prisma } from '@/lib/prisma';

export class ClienteBackendService {
  static async buscarPorNit(nit: string) {
    if (!nit) return null;
    return prisma.cliente.findFirst({
      where: { nit: { equals: nit, mode: 'insensitive' }, activo: true },
      select: {
        id: true,
        nombre: true,
        nit: true,
        telefono: true,
        email: true,
        direccion: true,
      },
    });
  }

  static async getHistorial(nit: string, nombre: string) {
    if (!nit && !nombre) throw new Error('NIT o nombre requerido');

    const where: any = { estado: 'completada' };
    if (nit && nit !== 'CF') where.clienteNit = { contains: nit, mode: 'insensitive' };
    else if (nombre) where.clienteNombre = { contains: nombre, mode: 'insensitive' };

    const ventas = await prisma.venta.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: 50,
      include: { items: true },
    });

    const totalCompras = ventas.reduce((s, v) => s + v.total, 0);
    
    const garantias = nit && nit !== 'CF'
      ? await prisma.garantia.findMany({ where: { clienteNit: { contains: nit, mode: 'insensitive' }, estado: 'vigente' } })
      : [];
      
    const ordenes = nombre
      ? await prisma.ordenTrabajo.findMany({ where: { clienteNombre: { contains: nombre, mode: 'insensitive' } }, orderBy: { id: 'desc' }, take: 10 })
      : [];

    return {
      ventas,
      totalCompras,
      numCompras: ventas.length,
      garantias,
      ordenes,
    };
  }
}
