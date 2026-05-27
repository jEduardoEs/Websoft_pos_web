import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fechaIni = searchParams.get('fecha_ini')
  const fechaFin = searchParams.get('fecha_fin')

  const where: any = { estado: 'completada' }
  if (fechaIni || fechaFin) {
    where.fecha = {}
    if (fechaIni) where.fecha.gte = new Date(fechaIni)
    if (fechaFin) { const e = new Date(fechaFin); e.setHours(23,59,59,999); where.fecha.lte = e }
  }

  const ventas = await prisma.venta.findMany({ where, include: { items: true }, orderBy: { fecha: 'asc' } })

  // Aggregate
  const totalVentas = ventas.length
  const granTotal = ventas.reduce((s, v) => s + v.total, 0)
  const totalDescuento = ventas.reduce((s, v) => s + v.descuento, 0)
  const totalImpuesto = ventas.reduce((s, v) => s + v.impuesto, 0)

  const porDia: Record<string, { total: number; ventas: number }> = {}
  const porMes: Record<string, { total: number; ventas: number }> = {}
  const porMetodo: Record<string, { total: number; ventas: number }> = {}
  const cajeros: Record<string, { nombre: string; total: number; ventas: number }> = {}
  const productosMap: Record<string, { nombre: string; qty: number; total: number }> = {}

  for (const v of ventas) {
    const day = new Date(v.fecha).toISOString().slice(0, 10)
    const mes = new Date(v.fecha).toISOString().slice(0, 7)
    if (!porDia[day]) porDia[day] = { total: 0, ventas: 0 }
    porDia[day].total += v.total; porDia[day].ventas++
    if (!porMes[mes]) porMes[mes] = { total: 0, ventas: 0 }
    porMes[mes].total += v.total; porMes[mes].ventas++
    if (!porMetodo[v.metodoPago]) porMetodo[v.metodoPago] = { total: 0, ventas: 0 }
    porMetodo[v.metodoPago].total += v.total; porMetodo[v.metodoPago].ventas++
    const cid = v.usuarioNombre || 'Desconocido'
    if (!cajeros[cid]) cajeros[cid] = { nombre: cid, total: 0, ventas: 0 }
    cajeros[cid].total += v.total; cajeros[cid].ventas++
    for (const item of v.items) {
      if (!productosMap[item.nombre]) productosMap[item.nombre] = { nombre: item.nombre, qty: 0, total: 0 }
      productosMap[item.nombre].qty += item.cantidad; productosMap[item.nombre].total += item.subtotal
    }
  }

  const topProductos = Object.values(productosMap).sort((a, b) => b.total - a.total).slice(0, 10)
  const porCajero = Object.values(cajeros)

  return NextResponse.json({
    totalVentas, granTotal, totalDescuento, totalImpuesto,
    porDia, porMes, porMetodo, topProductos, porCajero,
    detalle: ventas.map(v => ({ id: v.id, numero: v.numero, fecha: v.fecha, clienteNombre: v.clienteNombre, total: v.total, metodoPago: v.metodoPago, usuarioNombre: v.usuarioNombre })),
  })
}
