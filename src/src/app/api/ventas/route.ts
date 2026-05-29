import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fechaIni = searchParams.get('fecha_ini')
  const fechaFin = searchParams.get('fecha_fin')
  const estado = searchParams.get('estado') || ''

  const where: any = {}
  if (estado) where.estado = estado
  if (fechaIni || fechaFin) {
    where.fecha = {}
    if (fechaIni) where.fecha.gte = new Date(fechaIni)
    if (fechaFin) {
      const end = new Date(fechaFin)
      end.setHours(23, 59, 59, 999)
      where.fecha.lte = end
    }
  }

  const ventas = await prisma.venta.findMany({
    where, orderBy: { fecha: 'desc' }, take: 200,
    include: { items: true },
  })
  return NextResponse.json(ventas)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { clienteNombre, clienteNit, items, subtotal, descuento, impuesto, total, metodoPago, montoRecibido, cambio, notas } = body

  if (!items || items.length === 0) return NextResponse.json({ error: 'Sin items' }, { status: 400 })

  // Get next number
  const cfg = await prisma.config.findUnique({ where: { clave: 'numero_siguiente' } })
  const num = parseInt(cfg?.valor || '1')
  const numero = `FAC-${String(num).padStart(6, '0')}`

  // Verify stock
  for (const item of items) {
    const prod = await prisma.producto.findUnique({ where: { id: item.productoId } })
    if (!prod || prod.stock < item.cantidad) {
      return NextResponse.json({ error: `Stock insuficiente: ${item.nombre}` }, { status: 400 })
    }
  }

  // Create venta with items
  const venta = await prisma.$transaction(async (tx) => {
    const v = await tx.venta.create({
      data: {
        numero, fecha: new Date(),
        clienteNombre: clienteNombre || 'Consumidor Final',
        clienteNit: clienteNit || 'CF',
        subtotal: +subtotal, descuento: +descuento, impuesto: +impuesto,
        total: +total, metodoPago, montoRecibido: +montoRecibido, cambio: +cambio,
        notas, usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name,
        items: {
          create: items.map((item: any) => ({
            productoId: item.productoId, codigo: item.codigo || '',
            nombre: item.nombre, cantidad: +item.cantidad,
            precioUnitario: +item.precioUnitario, descuento: +item.descuento || 0,
            subtotal: +item.subtotal,
          })),
        },
      },
      include: { items: true },
    })

    // Update stock & kardex
    for (const item of items) {
      const prod = await tx.producto.findUnique({ where: { id: item.productoId } })
      if (prod) {
        const newStock = prod.stock - item.cantidad
        await tx.producto.update({ where: { id: item.productoId }, data: { stock: newStock } })
        await tx.kardex.create({
          data: {
            productoId: item.productoId, tipo: 'salida', cantidad: item.cantidad,
            stockAntes: prod.stock, stockDespues: newStock,
            motivo: `Venta ${numero}`, referencia: numero,
            usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name,
          },
        })
      }
    }

    // Update numero siguiente
    await tx.config.update({ where: { clave: 'numero_siguiente' }, data: { valor: String(num + 1) } })

    // Audit
    await tx.auditLog.create({
      data: {
        usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name,
        accion: 'CREATE', tabla: 'ventas', registroId: String(v.id),
        detalle: `Venta ${numero} por ${total}`,
      },
    })

    return v
  })

  return NextResponse.json({ ok: true, venta })
}
