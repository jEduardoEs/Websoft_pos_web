// src/modules/dashboard/repositories/metrics.repository.ts

import { prisma } from '@/lib/prisma';

/** Helper to log query execution time */
function logPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  console.time(`[MetricsRepository] ${name}`);
  return fn().finally(() => console.timeEnd(`[MetricsRepository] ${name}`));
}

export class MetricsRepository {
  static async getBaseSalesAggregates(startOfDay: Date, startOfWeek: Date, startOfMonth: Date) {
    return logPerformance('getBaseSalesAggregates', async () => {
      const [ventasHoy, ventasMes, ventasSemana, productosbajostock, totalClientes] = await Promise.all([
        prisma.venta.aggregate({ where: { fecha: { gte: startOfDay }, estado: { not: 'anulada' } }, _sum: { total: true }, _count: true }),
        prisma.venta.aggregate({ where: { fecha: { gte: startOfMonth }, estado: { not: 'anulada' } }, _sum: { total: true }, _count: true }),
        prisma.venta.aggregate({ where: { fecha: { gte: startOfWeek }, estado: { not: 'anulada' } }, _sum: { total: true }, _count: true }),
        prisma.producto.count({ where: { activo: true, stock: { lte: 5 } } }),
        prisma.cliente.count({ where: { activo: true } }),
      ]);
      return { ventasHoy, ventasMes, ventasSemana, productosbajostock, totalClientes };
    });
  }

  static async getPresupuesto(year: number, month: number) {
    return logPerformance('getPresupuesto', async () =>
      prisma.presupuesto.findFirst({ where: { anio: year, mes: month } })
    );
  }

  static async getVentasDiaLast7() {
    return logPerformance('getVentasDiaLast7', async () => {
      const diasArray = Array.from({ length: 7 }, (_, idx) => 6 - idx);
      return Promise.all(
        diasArray.map(async (i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const fin = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
          const v = await prisma.venta.aggregate({
            where: { fecha: { gte: inicio, lt: fin }, estado: { not: 'anulada' } },
            _sum: { total: true },
            _count: true,
          });
          return { dia: inicio.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric' }), total: v._sum.total || 0, ventas: v._count };
        })
      );
    });
  }

  static async getUsuariosStats(startOfMonth: Date, startOfDay: Date) {
    return logPerformance('getUsuariosStats', async () => {
      const usuarios = await prisma.usuario.findMany({
        where: { activo: true, metaMensual: { gt: 0 }, rol: { notIn: ['admin', 'contador', 'bodega'] } },
        select: { id: true, nombre: true, rol: true, metaMensual: true },
      });
      const [mesGroup, diaGroup] = await Promise.all([
        prisma.venta.groupBy({ by: ['usuarioId'], where: { fecha: { gte: startOfMonth }, estado: { not: 'anulada' } }, _sum: { total: true }, _count: true }),
        prisma.venta.groupBy({ by: ['usuarioId'], where: { fecha: { gte: startOfDay }, estado: { not: 'anulada' } }, _sum: { total: true }, _count: true }),
      ]);
      const mesMap = new Map<number, any>();
      const diaMap = new Map<number, any>();
      mesGroup.forEach((g) => mesMap.set(g.usuarioId, g));
      diaGroup.forEach((g) => diaMap.set(g.usuarioId, g));
      return usuarios.map((u) => {
        const mes = mesMap.get(u.id) ?? { _sum: { total: 0 }, _count: 0 };
        const dia = diaMap.get(u.id) ?? { _sum: { total: 0 }, _count: 0 };
        const real = mes._sum.total || 0;
        const meta = u.metaMensual || 0;
        return { id: u.id, nombre: u.nombre, rol: u.rol, meta, realMes: real, ventasMes: mes._count, realHoy: dia._sum.total || 0, ventasHoy: dia._count, cumplimiento: meta > 0 ? Math.round((real / meta) * 100) : null };
      });
    });
  }

  static async getMiMeta(userId: number, startOfMonth: Date, startOfDay: Date) {
    return logPerformance('getMiMeta', async () => {
      const [usuario, ventasMes, ventasDia] = await Promise.all([
        prisma.usuario.findUnique({ where: { id: userId }, select: { metaMensual: true } }),
        prisma.venta.aggregate({ where: { usuarioId: userId, fecha: { gte: startOfMonth }, estado: { not: 'anulada' } }, _sum: { total: true }, _count: true }),
        prisma.venta.aggregate({ where: { usuarioId: userId, fecha: { gte: startOfDay }, estado: { not: 'anulada' } }, _sum: { total: true }, _count: true }),
      ]);
      const meta = usuario?.metaMensual || 0;
      const real = ventasMes._sum.total || 0;
      return { meta, realMes: real, ventasMes: ventasMes._count, realHoy: ventasDia._sum.total || 0, ventasHoy: ventasDia._count, cumplimiento: meta > 0 ? Math.round((real / meta) * 100) : null };
    });
  }

  static async getPendingCounts() {
    return logPerformance('getPendingCounts', async () => {
      const [ordenesPendientes, cotizacionesPendientes, garantiasPorVencer] = await Promise.all([
        prisma.ordenTrabajo.count({ where: { estado: { in: ['recibido', 'diagnostico', 'en_proceso'] } } }),
        prisma.cotizacion.count({ where: { estado: 'pendiente' } }),
        prisma.garantia.count({ where: { estado: 'vigente', fechaVencimiento: { lte: new Date(Date.now() + 30 * 86400000) } } }),
      ]);
      return { ordenesPendientes, cotizacionesPendientes, garantiasPorVencer };
    });
  }
}
