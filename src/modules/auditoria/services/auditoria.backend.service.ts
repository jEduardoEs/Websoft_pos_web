import { prisma } from '@/lib/prisma';

export class AuditoriaBackendService {
  static async getLogs(params: {
    tabla?: string;
    accion?: string;
    usuarioId?: number;
    desde?: string;
    hasta?: string;
    limit?: number;
  }) {
    const where: any = {};
    if (params.tabla) where.tabla = params.tabla;
    if (params.accion) where.accion = params.accion;
    if (params.usuarioId) where.usuarioId = params.usuarioId;
    if (params.desde || params.hasta) {
      where.fecha = {};
      if (params.desde) where.fecha.gte = new Date(params.desde);
      if (params.hasta) where.fecha.lte = new Date(params.hasta + 'T23:59:59');
    }

    const limit = Math.min(params.limit || 100, 500);

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: limit,
    });

    const tablas = await prisma.auditLog.findMany({
      select: { tabla: true },
      distinct: ['tabla'],
    });

    return {
      logs,
      tablas: tablas.map((t: any) => t.tabla).filter(Boolean),
    };
  }
}
