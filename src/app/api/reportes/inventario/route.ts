import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const productos = await prisma.producto.findMany({
      where: { activo: true },
      orderBy: { categoria: 'asc' },
      select: { id: true, codigo: true, nombre: true, categoria: true, stock: true, stockMinimo: true, precio: true, costo: true },
    })

    const porCategoria: Record<string, any> = {}
    let totalInversion = 0, totalValorVenta = 0, totalProductos = 0
    let productosStockBajo = 0, productosAgotados = 0

    for (const p of productos) {
      const cat = p.categoria || 'General'
      if (!porCategoria[cat]) porCategoria[cat] = { categoria: cat, items: 0, stock: 0, inversion: 0, valorVenta: 0 }
      const inv = p.stock * p.costo
      const val = p.stock * p.precio
      porCategoria[cat].items++
      porCategoria[cat].stock += p.stock
      porCategoria[cat].inversion += inv
      porCategoria[cat].valorVenta += val
      totalInversion += inv
      totalValorVenta += val
      totalProductos++
      if (p.stock === 0) productosAgotados++
      else if (p.stock <= p.stockMinimo) productosStockBajo++
    }

    return NextResponse.json({
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
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
