import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() 
  try {

    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    return NextResponse.json(await prisma.compra.findMany({ orderBy: { id: 'desc' }, take: 100, include: { items: true } }))
  }

  } catch (e: any) {
    console.error('compras/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
export async function POST(req: NextRequest) 
  try {

    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const body = await req.json()
    const { proveedorId, proveedorNombre, items, subtotal, impuesto, total, estado, fechaVencimiento, notas } = body

    const cfg = await prisma.config.findUnique({ where: { clave: 'numero_siguiente_compra' } })
    const num = parseInt(cfg?.valor || '1')
    const numero = `OC-${String(num).padStart(6, '0')}`

    await prisma.$transaction(async (tx) => {
      const c = await tx.compra.create({
        data: {
          numero, proveedorId: proveedorId ? Number(proveedorId) : null,
          proveedorNombre, subtotal: +subtotal, impuesto: +impuesto, total: +total,
          estado: estado || 'recibida', fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
          notas, usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name,
          items: { create: items.map((i: any) => ({ productoId: i.productoId ? Number(i.productoId) : null, nombre: i.nombre, cantidad: +i.cantidad, precioUnitario: +i.precioUnitario, subtotal: +i.subtotal })) },
        },
      })
      // Update stock if received
      if (estado === 'recibida') {
        for (const item of items) {
          if (!item.productoId) continue
          const prod = await tx.producto.findUnique({ where: { id: Number(item.productoId) } })
          if (prod) {
            const newStock = prod.stock + item.cantidad
            await tx.producto.update({ where: { id: prod.id }, data: { stock: newStock } })
            await tx.kardex.create({ data: { productoId: prod.id, tipo: 'entrada', cantidad: item.cantidad, stockAntes: prod.stock, stockDespues: newStock, motivo: `Compra ${numero}`, referencia: numero, usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name } })
          }
        }
      }
      await tx.config.upsert({ where: { clave: 'numero_siguiente_compra' }, update: { valor: String(num + 1) }, create: { clave: 'numero_siguiente_compra', valor: String(num + 1) } })
    })
    return NextResponse.json({ ok: true })
  }

  } catch (e: any) {
    console.error('compras/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}