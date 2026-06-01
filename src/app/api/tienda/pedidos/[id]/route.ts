import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Admin: confirm order, convert to sale, discount stock
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { accion } = await req.json()
    const pedido = await prisma.pedidoWeb.findUnique({
      where: { id: Number(params.id) },
      include: { items: true },
    })
    if (!pedido) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    if (accion === 'confirmar') {
      // Convert to sale + discount stock
      const cfg = await prisma.config.findUnique({ where: { clave: 'numero_siguiente' } })
      const num = parseInt(cfg?.valor || '1')
      const numero = `FAC-${String(num).padStart(6, '0')}`

      const result = await prisma.$transaction(async (tx) => {
        const venta = await tx.venta.create({
          data: {
            numero,
            clienteNombre: pedido.clienteNombre,
            clienteNit: pedido.clienteNit || 'CF',
            subtotal: pedido.subtotal,
            descuento: 0,
            impuesto: pedido.subtotal * 0.05,
            total: pedido.total,
            metodoPago: 'online',
            montoRecibido: pedido.total,
            cambio: 0,
            notas: `Pedido web ${pedido.numero}`,
            usuarioId: parseInt(session.user.id),
            usuarioNombre: session.user.name,
            items: {
              create: pedido.items.map(item => ({
                nombre: item.nombre,
                codigo: item.codigo || '',
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                descuento: 0,
                subtotal: item.subtotal,
              })),
            },
          },
        })

        // Discount stock
        for (const item of pedido.items) {
          if (!item.productoId) continue
          const prod = await tx.producto.findUnique({ where: { id: item.productoId } })
          if (!prod) continue
          const newStock = Math.max(0, prod.stock - item.cantidad)
          await tx.producto.update({ where: { id: prod.id }, data: { stock: newStock } })
          await tx.kardex.create({
            data: {
              productoId: prod.id, tipo: 'salida',
              cantidad: item.cantidad, stockAntes: prod.stock, stockDespues: newStock,
              motivo: `Venta online ${pedido.numero}`,
              usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name,
            },
          })
        }

        await tx.pedidoWeb.update({
          where: { id: pedido.id },
          data: { estado: 'confirmado', ventaId: venta.id, procesadoPor: session.user.name, fechaProcesado: new Date() },
        })

        await tx.config.update({ where: { clave: 'numero_siguiente' }, data: { valor: String(num + 1) } })
        return venta
      })

      return NextResponse.json({ ok: true, venta: result })
    }

    if (accion === 'cancelar') {
      await prisma.pedidoWeb.update({ where: { id: pedido.id }, data: { estado: 'cancelado' } })
      return NextResponse.json({ ok: true })
    }

    if (accion === 'enviado') {
      await prisma.pedidoWeb.update({ where: { id: pedido.id }, data: { estado: 'enviado' } })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
