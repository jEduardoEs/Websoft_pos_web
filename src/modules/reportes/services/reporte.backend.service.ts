import { prisma } from '@/lib/prisma';

export class ReporteBackendService {
  static async getReporteVentas(fechaIni?: string | null, fechaFin?: string | null) {
    const where: any = { estado: 'completada' };
    if (fechaIni || fechaFin) {
      where.fecha = {};
      if (fechaIni) where.fecha.gte = new Date(fechaIni);
      if (fechaFin) {
        const e = new Date(fechaFin);
        e.setHours(23, 59, 59, 999);
        where.fecha.lte = e;
      }
    }

    const ventas = await prisma.venta.findMany({
      where,
      select: {
        id: true,
        numero: true,
        fecha: true,
        clienteNombre: true,
        total: true,
        descuento: true,
        impuesto: true,
        metodoPago: true,
        usuarioNombre: true,
        items: {
          select: {
            nombre: true,
            cantidad: true,
            subtotal: true,
          },
        },
      },
      orderBy: { fecha: 'asc' },
    });

    const totalVentas = ventas.length;
    const granTotal = ventas.reduce((s, v) => s + v.total, 0);
    const totalDescuento = ventas.reduce((s, v) => s + v.descuento, 0);
    const totalImpuesto = ventas.reduce((s, v) => s + v.impuesto, 0);

    const porDia: Record<string, { total: number; ventas: number }> = {};
    const porMes: Record<string, { total: number; ventas: number }> = {};
    const porMetodo: Record<string, { total: number; ventas: number }> = {};
    const cajeros: Record<string, { nombre: string; total: number; ventas: number }> = {};
    const productosMap: Record<string, { nombre: string; qty: number; total: number }> = {};

    for (const v of ventas) {
      const day = new Date(v.fecha).toISOString().slice(0, 10);
      const mes = new Date(v.fecha).toISOString().slice(0, 7);
      if (!porDia[day]) porDia[day] = { total: 0, ventas: 0 };
      porDia[day].total += v.total;
      porDia[day].ventas++;
      if (!porMes[mes]) porMes[mes] = { total: 0, ventas: 0 };
      porMes[mes].total += v.total;
      porMes[mes].ventas++;
      if (!porMetodo[v.metodoPago]) porMetodo[v.metodoPago] = { total: 0, ventas: 0 };
      porMetodo[v.metodoPago].total += v.total;
      porMetodo[v.metodoPago].ventas++;
      const cid = v.usuarioNombre || 'Desconocido';
      if (!cajeros[cid]) cajeros[cid] = { nombre: cid, total: 0, ventas: 0 };
      cajeros[cid].total += v.total;
      cajeros[cid].ventas++;
      for (const item of v.items) {
        if (!productosMap[item.nombre]) productosMap[item.nombre] = { nombre: item.nombre, qty: 0, total: 0 };
        productosMap[item.nombre].qty += item.cantidad;
        productosMap[item.nombre].total += item.subtotal;
      }
    }

    const topProductos = Object.values(productosMap).sort((a, b) => b.total - a.total).slice(0, 10);
    const porCajero = Object.values(cajeros);

    return {
      totalVentas,
      granTotal,
      totalDescuento,
      totalImpuesto,
      porDia,
      porMes,
      porMetodo,
      topProductos,
      porCajero,
      detalle: ventas.slice(-500).map(v => ({
        id: v.id,
        numero: v.numero,
        fecha: v.fecha,
        clienteNombre: v.clienteNombre,
        total: v.total,
        metodoPago: v.metodoPago,
        usuarioNombre: v.usuarioNombre,
      })),
    };
  }

  static async getReporteInventario() {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      orderBy: { categoria: 'asc' },
      select: { id: true, codigo: true, nombre: true, categoria: true, stock: true, stockMinimo: true, precio: true, costo: true },
    });

    const porCategoria: Record<string, any> = {};
    let totalInversion = 0, totalValorVenta = 0, totalProductos = 0;
    let productosStockBajo = 0, productosAgotados = 0;

    for (const p of productos) {
      const cat = p.categoria || 'General';
      if (!porCategoria[cat]) porCategoria[cat] = { categoria: cat, items: 0, stock: 0, inversion: 0, valorVenta: 0 };
      const inv = p.stock * p.costo;
      const val = p.stock * p.precio;
      porCategoria[cat].items++;
      porCategoria[cat].stock += p.stock;
      porCategoria[cat].inversion += inv;
      porCategoria[cat].valorVenta += val;
      totalInversion += inv;
      totalValorVenta += val;
      totalProductos++;
      if (p.stock === 0) productosAgotados++;
      else if (p.stock <= p.stockMinimo) productosStockBajo++;
    }

    return {
      productos,
      porCategoria: Object.values(porCategoria).sort((a: any, b: any) => b.inversion - a.inversion),
      resumen: {
        totalProductos,
        totalUnidades: productos.reduce((s, p) => s + p.stock, 0),
        totalInversion,
        totalValorVenta,
        gananciaProyectada: totalValorVenta - totalInversion,
        margenProyectado: totalInversion > 0 ? Math.round(((totalValorVenta - totalInversion) / totalInversion) * 100) : 0,
        productosStockBajo,
        productosAgotados,
      },
    };
  }

  static async getReportePatrimonio() {
    const activosFijos = await prisma.activoFijo.findMany({
      where: { estado: 'activo' },
      orderBy: { fechaAdquisicion: 'asc' },
    });

    const resumenActivos = {
      cantidad: activosFijos.length,
      valorBruto: activosFijos.reduce((s, a) => s + a.costoOriginal, 0),
      depreciacionAcum: activosFijos.reduce((s, a) => s + a.depreciacionAcum, 0),
      valorNeto: activosFijos.reduce((s, a) => s + a.valorNeto, 0),
    };

    const productos = await prisma.producto.findMany({
      where: { activo: true, stock: { gt: 0 } },
      orderBy: { categoria: 'asc' },
      select: {
        id: true, codigo: true, nombre: true, categoria: true,
        stock: true, costo: true, precio: true,
      },
    });

    const porCategoria: Record<string, { categoria: string; items: number; unidades: number; valorCosto: number; valorVenta: number }> = {};
    for (const p of productos) {
      const cat = p.categoria || 'General';
      if (!porCategoria[cat]) porCategoria[cat] = { categoria: cat, items: 0, unidades: 0, valorCosto: 0, valorVenta: 0 };
      porCategoria[cat].items++;
      porCategoria[cat].unidades += p.stock;
      porCategoria[cat].valorCosto += p.stock * p.costo;
      porCategoria[cat].valorVenta += p.stock * p.precio;
    }

    const resumenInventario = {
      totalProductos: productos.length,
      totalUnidades: productos.reduce((s, p) => s + p.stock, 0),
      valorCosto: productos.reduce((s, p) => s + p.stock * p.costo, 0),
      valorVenta: productos.reduce((s, p) => s + p.stock * p.precio, 0),
    };

    const cfgRows = await prisma.config.findMany({
      where: { clave: { in: ['empresa_nombre', 'empresa_nit', 'empresa_direccion', 'empresa_telefono', 'empresa_web'] } },
    });
    const cfg = Object.fromEntries(cfgRows.map(c => [c.clave, c.valor]));

    const totalPatrimonio = resumenActivos.valorNeto + resumenInventario.valorCosto;

    return {
      empresa: {
        nombre: cfg.empresa_nombre || 'WebSoft Solutions',
        nit: cfg.empresa_nit || '115471413',
        direccion: cfg.empresa_direccion || 'Barrio el Calvario, Guastatoya, El Progreso',
        telefono: cfg.empresa_telefono || '3836-1044',
        web: cfg.empresa_web || 'websoftsolutions.com.gt',
      },
      fechaReporte: new Date().toISOString(),
      activosFijos,
      resumenActivos,
      productos,
      porCategoria: Object.values(porCategoria).sort((a: any, b: any) => b.valorCosto - a.valorCosto),
      resumenInventario,
      totalPatrimonio,
    };
  }
}
