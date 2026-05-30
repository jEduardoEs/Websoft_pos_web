import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const compras = await prisma.compra.findMany({
      orderBy: { id: 'desc' },
      take: 100,
      include: {
        items: true,
        proveedor: { select: { nombre: true } },
      },
    })
    return NextResponse.json(compras)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { proveedorId, fecha, numeroFactura, serieFactura, facturaUrl, items, notas } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Agrega al menos un producto' }, { status: 400 })
    }

    const total = items.reduce((s: number, i: any) => s + (+i.cantidad * +i.precioUnitario), 0)

    const count = await prisma.compra.count()
    const numero = `CMP-${String(count + 1).padStart(6, '0')}`

    const compra = await prisma.$transaction(async (tx) => {
      const c = await tx.compra.create({
        data: {
          numero,
          proveedorId: proveedorId ? Number(proveedorId) : null,
          fecha: fecha ? new Date(fecha) : new Date(),
          total,
          numeroFactura: numeroFactura || null,
          serieFactura: serieFactura || null,
          facturaUrl: facturaUrl || null,
          notas: notas || null,
          usuarioId: parseInt(session.user.id),
          usuarioNombre: session.user.name,
          items: {
            create: items.map((item: any) => ({
              productoId: item.productoId ? Number(item.productoId) : null,
              nombre: item.nombre,
              cantidad: +item.cantidad,
              precioUnitario: +item.precioUnitario,
              subtotal: +item.cantidad * +item.precioUnitario,
            })),
          },
        },
        include: { items: true },
      })

      // Update stock for each item with a product
      for (const item of items) {
        if (!item.productoId) continue
        const prod = await tx.producto.findUnique({ where: { id: Number(item.productoId) } })
        if (!prod) continue
        const newStock = prod.stock + Number(item.cantidad)
        await tx.producto.update({ where: { id: prod.id }, data: { stock: newStock } })
        await tx.kardex.create({
          data: {
            productoId: prod.id,
            tipo: 'entrada',
            cantidad: Number(item.cantidad),
            stockAntes: prod.stock,
            stockDespues: newStock,
            motivo: `Compra ${numero}${numeroFactura ? ` — Factura ${serieFactura || ''}${numeroFactura}` : ''}`,
            referencia: numeroFactura || null,
            usuarioId: parseInt(session.user.id),
            usuarioNombre: session.user.name,
          },
        })
      }

      return c
    })

    return NextResponse.json({ ok: true, compra })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
