import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const venta = await prisma.venta.findUnique({
    where: { id: Number(params.id) },
    include: { items: true },
  })
  if (!venta) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(venta)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const motivo = body.motivo || 'Anulación'

  const venta = await prisma.venta.findUnique({ where: { id: Number(params.id) }, include: { items: true } })
  if (!venta) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (venta.estado === 'anulada') return NextResponse.json({ error: 'Ya anulada' }, { status: 400 })

  await prisma.$transaction(async (tx) => {
    await tx.venta.update({ where: { id: venta.id }, data: { estado: 'anulada', notas: motivo } })

    // Restore stock
    for (const item of venta.items) {
      if (!item.productoId) continue
      const prod = await tx.producto.findUnique({ where: { id: item.productoId } })
      if (prod) {
        const newStock = prod.stock + item.cantidad
        await tx.producto.update({ where: { id: item.productoId }, data: { stock: newStock } })
        await tx.kardex.create({
          data: {
            productoId: item.productoId, tipo: 'entrada', cantidad: item.cantidad,
            stockAntes: prod.stock, stockDespues: newStock,
            motivo: `Anulación venta ${venta.numero}`, referencia: venta.numero,
            usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name,
          },
        })
      }
    }

    await tx.auditLog.create({
      data: {
        usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name,
        accion: 'ANULAR', tabla: 'ventas', registroId: String(venta.id),
        detalle: `Anulación venta ${venta.numero}: ${motivo}`,
      },
    })
  })

  return NextResponse.json({ ok: true })
}
