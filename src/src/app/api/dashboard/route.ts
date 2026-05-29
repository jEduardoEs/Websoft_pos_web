import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() 
  try {

    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const [ventasHoy, totalHoy, totalMes, productosLow] = await Promise.all([
      prisma.venta.count({ where: { fecha: { gte: today }, estado: 'completada' } }),
      prisma.venta.aggregate({ where: { fecha: { gte: today }, estado: 'completada' }, _sum: { total: true } }),
      prisma.venta.aggregate({ where: { fecha: { gte: monthStart }, estado: 'completada' }, _sum: { total: true } }),
      prisma.producto.count({ where: { activo: true, stock: { lte: 5 } } }),
    ])

    const topProductos = await prisma.ventaItem.groupBy({
      by: ['nombre'],
      where: { venta: { fecha: { gte: today }, estado: 'completada' } },
      _sum: { cantidad: true, subtotal: true },
      orderBy: { _sum: { cantidad: 'desc' } }, take: 5,
    })

    const productosStockBajo = await prisma.producto.findMany({
      where: { activo: true, stock: { lte: 5 } },
      orderBy: { stock: 'asc' }, take: 10,
      select: { nombre: true, stock: true, stockMinimo: true, categoria: true },
    })

    return NextResponse.json({
      ventasHoy, totalHoy: totalHoy._sum.total || 0,
      totalMes: totalMes._sum.total || 0,
      productosLow, topProductos, productosStockBajo,
    })
  }

  } catch (e: any) {
    console.error('dashboard/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}