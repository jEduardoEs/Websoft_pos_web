import { prisma } from '@/lib/prisma';

export class CajaBackendService {
  static async getCierres() {
    return prisma.cierre.findMany({ orderBy: { id: 'desc' }, take: 50 });
  }

  static async crearCierre(fechaInicio: string, fechaFin: string, notas: string, user: any) {
    const start = fechaInicio ? new Date(fechaInicio) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = fechaFin ? new Date(fechaFin) : new Date();
    if (fechaFin) end.setHours(23, 59, 59, 999);

    const ventas = await prisma.venta.findMany({
      where: { fecha: { gte: start, lte: end }, estado: 'completada' },
      select: { total: true, metodoPago: true },
    });
    
    const totals = ventas.reduce(
      (acc, v) => {
        acc.granTotal += v.total;
        if (v.metodoPago === 'efectivo') acc.efectivo += v.total;
        else if (v.metodoPago === 'tarjeta') acc.tarjeta += v.total;
        else if (v.metodoPago === 'transferencia') acc.transferencia += v.total;
        return acc;
      },
      { efectivo: 0, tarjeta: 0, transferencia: 0, granTotal: 0 }
    );

    return prisma.cierre.create({
      data: {
        fechaInicio: start,
        fechaFin: end,
        totalVentas: ventas.length,
        totalEfectivo: totals.efectivo,
        totalTarjeta: totals.tarjeta,
        totalTransferencia: totals.transferencia,
        granTotal: totals.granTotal,
        usuarioId: parseInt(user.id),
        usuarioNombre: user.name,
        notas,
      },
    });
  }

  static async getAperturaActiva() {
    return prisma.aperturaCaja.findFirst({
      where: { estado: 'abierta' },
      orderBy: { id: 'desc' },
    });
  }

  static async abrirCaja(fondo: number, notas: string, user: any) {
    const activa = await this.getAperturaActiva();
    if (activa) throw new Error('Ya hay una caja abierta');

    return prisma.aperturaCaja.create({
      data: {
        fondoInicial: fondo || 0,
        usuarioId: parseInt(user.id),
        usuarioNombre: user.name,
        notas,
      },
    });
  }

  static async cerrarCaja(notas: string) {
    const activa = await this.getAperturaActiva();
    if (!activa) throw new Error('No hay caja abierta');

    return prisma.aperturaCaja.update({
      where: { id: activa.id },
      data: {
        estado: 'cerrada',
        fechaCierre: new Date(),
        notas: notas ? `${activa.notas || ''} | Cierre: ${notas}` : activa.notas,
      },
    });
  }
}
