import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay())

    // Base sales queries
    const [ventasHoy, ventasMes, ventasSemana, productosbajostock, totalClientes] = await Promise.all([
      prisma.venta.aggregate({ where: { fecha: { gte: startOfDay }, estado: 'completada' }, _sum: { total: true }, _count: true }),
      prisma.venta.aggregate({ where: { fecha: { gte: startOfMonth }, estado: 'completada' }, _sum: { total: true }, _count: true }),
      prisma.venta.aggregate({ where: { fecha: { gte: startOfWeek }, estado: 'completada' }, _sum: { total: true }, _count: true }),
      prisma.producto.count({ where: { activo: true, stock: { lte: 5 } } }),
      prisma.cliente.count({ where: { activo: true } }),
    ])

    // Presupuesto del mes actual
    const presupuesto = await prisma.presupuesto.findFirst({
      where: { anio: now.getFullYear(), mes: now.getMonth() + 1 }
    })
    const metaMes = presupuesto?.meta || 0
    const realMes = ventasMes._sum.total || 0
    const cumplimientoMes = metaMes > 0 ? Math.round((realMes / metaMes) * 100) : 0

    // Ventas por día últimos 7 días for chart
    const ventasDia: any[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const fin = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
      const v = await prisma.venta.aggregate({
        where: { fecha: { gte: inicio, lt: fin }, estado: 'completada' },
        _sum: { total: true }, _count: true,
      })
      ventasDia.push({
        dia: inicio.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric' }),
        total: v._sum.total || 0,
        ventas: v._count,
      })
    }

    // Admin only: per-user stats
    let usuariosStats: any[] = []
    if (session.user.role === 'admin') {
      const usuarios = await prisma.usuario.findMany({
        where: { activo: true },
        select: { id: true, nombre: true, rol: true, metaMensual: true },
      })
      usuariosStats = await Promise.all(usuarios.map(async (u) => {
        const ventasU = await prisma.venta.aggregate({
          where: { usuarioId: u.id, fecha: { gte: startOfMonth }, estado: 'completada' },
          _sum: { total: true }, _count: true,
        })
        const ventasHoyU = await prisma.venta.aggregate({
          where: { usuarioId: u.id, fecha: { gte: startOfDay }, estado: 'completada' },
          _sum: { total: true }, _count: true,
        })
        const real = ventasU._sum.total || 0
        const meta = u.metaMensual || 0
        return {
          id: u.id, nombre: u.nombre, rol: u.rol, meta,
          realMes: real, ventasMes: ventasU._count,
          realHoy: ventasHoyU._sum.total || 0, ventasHoy: ventasHoyU._count,
          cumplimiento: meta > 0 ? Math.round((real / meta) * 100) : null,
        }
      }))
    }

    // Cajero: own meta
    let miMeta = null
    if (session.user.role !== 'admin') {
      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(session.user.id) },
        select: { metaMensual: true },
      })
      const misVentas = await prisma.venta.aggregate({
        where: { usuarioId: parseInt(session.user.id), fecha: { gte: startOfMonth }, estado: 'completada' },
        _sum: { total: true }, _count: true,
      })
      const misVentasHoy = await prisma.venta.aggregate({
        where: { usuarioId: parseInt(session.user.id), fecha: { gte: startOfDay }, estado: 'completada' },
        _sum: { total: true }, _count: true,
      })
      const meta = usuario?.metaMensual || 0
      const real = misVentas._sum.total || 0
      miMeta = {
        meta, realMes: real, ventasMes: misVentas._count,
        realHoy: misVentasHoy._sum.total || 0, ventasHoy: misVentasHoy._count,
        cumplimiento: meta > 0 ? Math.round((real / meta) * 100) : null,
        mes: now.toLocaleString('es-GT', { month: 'long', year: 'numeric' }),
      }
    }

    // Pending orders
    const [ordenesPendientes, cotizacionesPendientes, garantiasPorVencer] = await Promise.all([
      prisma.ordenTrabajo.count({ where: { estado: { in: ['recibido', 'diagnostico', 'en_proceso'] } } }),
      prisma.cotizacion.count({ where: { estado: 'pendiente' } }),
      prisma.garantia.count({ where: { estado: 'vigente', fechaVencimiento: { lte: new Date(Date.now() + 30 * 86400000) } } }),
    ])

    return NextResponse.json({
      ventasHoy: { total: ventasHoy._sum.total || 0, count: ventasHoy._count },
      ventasSemana: { total: ventasSemana._sum.total || 0, count: ventasSemana._count },
      ventasMes: { total: realMes, count: ventasMes._count },
      metaMes, cumplimientoMes,
      productosbajostock, totalClientes,
      ventasDia,
      usuariosStats,
      miMeta,
      ordenesPendientes, cotizacionesPendientes, garantiasPorVencer,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
