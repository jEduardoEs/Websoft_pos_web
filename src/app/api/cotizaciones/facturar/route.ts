import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { cotizacionId, metodoPago, montoRecibido, clienteNit, clienteNombre } = await req.json()

    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: Number(cotizacionId) },
      include: { items: true },
    })
    if (!cotizacion) return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    if (cotizacion.estado === 'facturada') return NextResponse.json({ error: 'Ya fue facturada' }, { status: 400 })

    // Get next invoice number
    const cfg = await prisma.config.findUnique({ where: { clave: 'numero_siguiente' } })
    const num = parseInt(cfg?.valor || '1')
    const numero = `FAC-${String(num).padStart(6, '0')}`

    const total = cotizacion.total
    const cambio = Math.max(0, (parseFloat(montoRecibido) || 0) - total)

    const venta = await prisma.$transaction(async (tx) => {
      const v = await tx.venta.create({
        data: {
          numero,
          clienteNombre: clienteNombre || cotizacion.clienteNombre,
          clienteNit: clienteNit || cotizacion.clienteNit || 'CF',
          subtotal: cotizacion.subtotal,
          descuento: cotizacion.descuento,
          impuesto: cotizacion.total - (cotizacion.subtotal - cotizacion.descuento),
          total: cotizacion.total,
          metodoPago: metodoPago || 'efectivo',
          montoRecibido: parseFloat(montoRecibido) || total,
          cambio,
          notas: `Facturado desde cotización ${cotizacion.numero}`,
          usuarioId: parseInt(session.user.id),
          usuarioNombre: session.user.name,
          items: {
            create: cotizacion.items.map(item => ({
              nombre: item.descripcion,
              codigo: item.codigo || '',
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              descuento: item.descuento,
              subtotal: item.totalItem,
            })),
          },
        },
        include: { items: true },
      })

      // Try to discount stock for items that match inventory products
      for (const item of cotizacion.items) {
        if (!item.codigo) continue
        const prod = await tx.producto.findFirst({
          where: {
            OR: [
              { codigo: item.codigo },
              { nombre: { equals: item.descripcion, mode: 'insensitive' } },
            ],
            activo: true,
          },
        })
        if (prod && prod.stock >= item.cantidad) {
          const newStock = prod.stock - item.cantidad
          await tx.producto.update({ where: { id: prod.id }, data: { stock: newStock } })
          await tx.kardex.create({
            data: {
              productoId: prod.id, tipo: 'salida', cantidad: item.cantidad,
              stockAntes: prod.stock, stockDespues: newStock,
              motivo: `Venta ${numero} (desde cotización ${cotizacion.numero})`,
              referencia: numero,
              usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name,
            },
          })
        }
      }

      // Update cotizacion estado
      await tx.cotizacion.update({
        where: { id: cotizacion.id },
        data: { estado: 'facturada' },
      })

      // Update numero siguiente
      await tx.config.update({
        where: { clave: 'numero_siguiente' },
        data: { valor: String(num + 1) },
      })

      return v
    })

    return NextResponse.json({ ok: true, venta, numero })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
