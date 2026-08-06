import { prisma } from '@/lib/prisma';

export class PresupuestoBackendService {
  static async getPresupuestoAnual(anio: number) {
    const presupuestos = await prisma.presupuesto.findMany({
      where: { anio },
      orderBy: { mes: 'asc' },
    });

    const startOfYear = new Date(anio, 0, 1);
    const endOfYear = new Date(anio, 11, 31, 23, 59, 59);
    
    const ventas = await prisma.venta.findMany({
      where: { fecha: { gte: startOfYear, lte: endOfYear }, estado: 'completada' },
      select: { fecha: true, total: true },
    });

    const meses = Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1;
      const pres = presupuestos.find(p => p.mes === mes);
      const ventasMes = ventas.filter(v => new Date(v.fecha).getMonth() + 1 === mes);
      const real = ventasMes.reduce((s, v) => s + v.total, 0);
      const meta = pres?.meta || 0;
      return {
        mes,
        mesNombre: new Date(anio, i, 1).toLocaleString('es-GT', { month: 'long' }),
        meta,
        real,
        diferencia: real - meta,
        cumplimiento: meta > 0 ? Math.round((real / meta) * 100) : 0,
        numVentas: ventasMes.length,
      };
    });

    const totalMeta = meses.reduce((s, m) => s + m.meta, 0);
    const totalReal = meses.reduce((s, m) => s + m.real, 0);

    return {
      anio,
      meses,
      totalMeta,
      totalReal,
      diferencia: totalReal - totalMeta,
    };
  }

  static async setMeta(anio: number, mes: number, meta: number, notas: string) {
    return prisma.presupuesto.upsert({
      where: { anio_mes: { anio, mes } },
      update: { meta, notas },
      create: { anio, mes, meta, notas },
    });
  }
}
