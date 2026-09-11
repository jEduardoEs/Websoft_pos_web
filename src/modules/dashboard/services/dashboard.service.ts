// src/modules/dashboard/services/dashboard.service.ts

import { MetricsRepository } from '@/modules/dashboard/repositories/metrics.repository';

/** Simple in‑memory cache with TTL */
class SimpleCache<T> {
  private store = new Map<string, { data: T; expires: number }>();
  async get(key: string, loader: () => Promise<T>, ttlMs: number): Promise<T> {
    const now = Date.now();
    const cached = this.store.get(key);
    if (cached && cached.expires > now) {
      return cached.data;
    }
    const data = await loader();
    this.store.set(key, { data, expires: now + ttlMs });
    return data;
  }
}

const cache = new SimpleCache<any>();

export class DashboardService {
  /** Core method used by the API route */
  static async getDashboardData(user: any) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    // 1️⃣ Base aggregates (always fresh)
    const base = await MetricsRepository.getBaseSalesAggregates(startOfDay, startOfWeek, startOfMonth);

    // 2️⃣ Presupuesto – cached for 60 seconds (dev friendly)
    const presupuesto = await cache.get(
      'presupuesto',
      () => MetricsRepository.getPresupuesto(now.getFullYear(), now.getMonth() + 1),
      60_000
    );
    const metaMes = presupuesto?.meta || 0;
    const realMes = base.ventasMes._sum.total || 0;
    const cumplimientoMes = metaMes > 0 ? Math.round((realMes / metaMes) * 100) : 0;

    // 3️⃣ Ventas por día (last 7 days)
    const ventasDia = await MetricsRepository.getVentasDiaLast7();

    // 4️⃣ Per‑user stats (admin only)
    let usuariosStats: any[] = [];
    if (user.role === 'admin') {
      usuariosStats = await MetricsRepository.getUsuariosStats(startOfMonth, startOfDay);
    }

    // 5️⃣ Personal meta for non‑admin users
    let miMeta: any = null;
    if (user.role !== 'admin') {
      const userId = parseInt(user.id as string);
      miMeta = await MetricsRepository.getMiMeta(userId, startOfMonth, startOfDay);
      miMeta.mes = now.toLocaleString('es-GT', { month: 'long', year: 'numeric' });
    }

    // 6️⃣ Pending counts – cached for 60 seconds
    const pending = await cache.get('pending', () => MetricsRepository.getPendingCounts(), 60_000);

    return {
      ventasHoy: { total: base.ventasHoy._sum.total || 0, count: base.ventasHoy._count },
      ventasSemana: { total: base.ventasSemana._sum.total || 0, count: base.ventasSemana._count },
      ventasMes: { total: realMes, count: base.ventasMes._count },
      metaMes,
      cumplimientoMes,
      productosbajostock: base.productosbajostock,
      totalClientes: base.totalClientes,
      ventasDia,
      usuariosStats,
      miMeta,
      ordenesPendientes: pending.ordenesPendientes,
      cotizacionesPendientes: pending.cotizacionesPendientes,
      garantiasPorVencer: pending.garantiasPorVencer,
    };
  }
}
