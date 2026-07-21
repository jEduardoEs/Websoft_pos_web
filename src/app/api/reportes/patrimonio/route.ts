import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // ── Activos Fijos ──────────────────────────────────────────────────────
    const activosFijos = await prisma.activoFijo.findMany({
      where: { estado: 'activo' },
      orderBy: { fechaAdquisicion: 'asc' },
    })

    const resumenActivos = {
      cantidad:          activosFijos.length,
      valorBruto:        activosFijos.reduce((s, a) => s + a.costoOriginal, 0),
      depreciacionAcum:  activosFijos.reduce((s, a) => s + a.depreciacionAcum, 0),
      valorNeto:         activosFijos.reduce((s, a) => s + a.valorNeto, 0),
    }

    // ── Inventario ─────────────────────────────────────────────────────────
    const productos = await prisma.producto.findMany({
      where: { activo: true, stock: { gt: 0 } },
      orderBy: { categoria: 'asc' },
      select: {
        id: true, codigo: true, nombre: true, categoria: true,
        stock: true, costo: true, precio: true,
      },
    })

    // Agrupar por categoría
    const porCategoria: Record<string, { categoria: string; items: number; unidades: number; valorCosto: number; valorVenta: number }> = {}
    for (const p of productos) {
      const cat = p.categoria || 'General'
      if (!porCategoria[cat]) porCategoria[cat] = { categoria: cat, items: 0, unidades: 0, valorCosto: 0, valorVenta: 0 }
      porCategoria[cat].items++
      porCategoria[cat].unidades   += p.stock
      porCategoria[cat].valorCosto += p.stock * p.costo
      porCategoria[cat].valorVenta += p.stock * p.precio
    }

    const resumenInventario = {
      totalProductos: productos.length,
      totalUnidades:  productos.reduce((s, p) => s + p.stock, 0),
      valorCosto:     productos.reduce((s, p) => s + p.stock * p.costo, 0),
      valorVenta:     productos.reduce((s, p) => s + p.stock * p.precio, 0),
    }

    // ── Configuración empresa ──────────────────────────────────────────────
    const cfgRows = await prisma.config.findMany({
      where: { clave: { in: ['empresa_nombre', 'empresa_nit', 'empresa_direccion', 'empresa_telefono', 'empresa_web'] } },
    })
    const cfg = Object.fromEntries(cfgRows.map(c => [c.clave, c.valor]))

    // ── Total patrimonio ───────────────────────────────────────────────────
    const totalPatrimonio = resumenActivos.valorNeto + resumenInventario.valorCosto

    return NextResponse.json({
      empresa: {
        nombre:    cfg.empresa_nombre    || 'WebSoft Solutions',
        nit:       cfg.empresa_nit       || '115471413',
        direccion: cfg.empresa_direccion || 'Barrio el Calvario, Guastatoya, El Progreso',
        telefono:  cfg.empresa_telefono  || '3836-1044',
        web:       cfg.empresa_web       || 'websoftsolutions.com.gt',
      },
      fechaReporte: new Date().toISOString(),
      activosFijos,
      resumenActivos,
      productos,
      porCategoria: Object.values(porCategoria).sort((a: any, b: any) => b.valorCosto - a.valorCosto),
      resumenInventario,
      totalPatrimonio,
    })

  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
