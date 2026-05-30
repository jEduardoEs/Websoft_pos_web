import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// PUBLIC POST - receives orders from landing page
// GET - admin only, lists all web orders
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const estado = searchParams.get('estado') || ''

    const where: any = {}
    if (estado) where.estado = estado

    const pedidos = await prisma.pedidoWeb.findMany({
      where, orderBy: { id: 'desc' }, take: 100,
      include: { items: true },
    })
    return NextResponse.json(pedidos)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      clienteNombre, clienteEmail, clienteTelefono,
      clienteNit, clienteDireccion, items, notas,
      stripeSessionId,
    } = body

    if (!clienteNombre || !clienteEmail) {
      return NextResponse.json({ error: 'Nombre y email son requeridos' }, { status: 400 })
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 })
    }

    // Validate stock for each item
    for (const item of items) {
      if (!item.productoId) continue
      const prod = await prisma.producto.findUnique({
        where: { id: Number(item.productoId) },
        select: { stock: true, nombre: true },
      })
      if (!prod) return NextResponse.json({ error: `Producto no encontrado` }, { status: 400 })
      if (prod.stock < item.cantidad) {
        return NextResponse.json({
          error: `Sin stock suficiente para: ${prod.nombre} (disponible: ${prod.stock})`
        }, { status: 400 })
      }
    }

    const subtotal = items.reduce((s: number, i: any) => s + (+i.precio * +i.cantidad), 0)
    const total = subtotal // No shipping for now

    const count = await prisma.pedidoWeb.count()
    const numero = `PW-${String(count + 1).padStart(6, '0')}`

    const pedido = await prisma.pedidoWeb.create({
      data: {
        numero, clienteNombre, clienteEmail,
        clienteTelefono: clienteTelefono || null,
        clienteNit: clienteNit || null,
        clienteDireccion: clienteDireccion || null,
        subtotal, total,
        stripeSessionId: stripeSessionId || null,
        estado: stripeSessionId ? 'pagado' : 'pendiente',
        notas: notas || null,
        items: {
          create: items.map((item: any) => ({
            productoId: item.productoId ? Number(item.productoId) : null,
            nombre: item.nombre,
            codigo: item.codigo || null,
            cantidad: +item.cantidad,
            precioUnitario: +item.precio,
            subtotal: +item.precio * +item.cantidad,
            imagenUrl: item.imagenUrl || null,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json(
      { ok: true, pedido, numero },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
