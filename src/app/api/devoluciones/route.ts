import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json(await prisma.devolucion.findMany({ orderBy: { id: 'desc' }, take: 100, include: { items: true } }))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { ventaId, ventaNumero, motivo, items, totalDevuelto } = await req.json()

  await prisma.$transaction(async (tx) => {
    const dev = await tx.devolucion.create({
      data: {
        ventaId: ventaId ? Number(ventaId) : null, ventaNumero, motivo, totalDevuelto: +totalDevuelto,
        usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name,
        items: { create: items.map((i: any) => ({ productoId: i.productoId ? Number(i.productoId) : null, nombre: i.nombre, cantidad: +i.cantidad, precioUnitario: +i.precioUnitario, subtotal: +i.subtotal })) },
      },
    })
    for (const item of items) {
      if (!item.productoId) continue
      const prod = await tx.producto.findUnique({ where: { id: Number(item.productoId) } })
      if (prod) {
        const newStock = prod.stock + item.cantidad
        await tx.producto.update({ where: { id: prod.id }, data: { stock: newStock } })
        await tx.kardex.create({ data: { productoId: prod.id, tipo: 'entrada', cantidad: item.cantidad, stockAntes: prod.stock, stockDespues: newStock, motivo: `Devolución ${ventaNumero || ''}`, usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name } })
      }
    }
  })
  return NextResponse.json({ ok: true })
}
