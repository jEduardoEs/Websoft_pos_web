import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const c = await prisma.cotizacion.findUnique({ where: { id: Number(params.id) }, include: { items: true } })
  if (!c) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(c)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { estado, pin } = await req.json()

  const estadosProtegidos = ['aceptada', 'rechazada']
  if (estadosProtegidos.includes(estado)) {
    if (session.user.role !== 'admin') {
      if (!pin) return NextResponse.json({ error: 'PIN_REQUIRED', message: 'Requiere autorizacion del administrador' }, { status: 403 })
      const admin = await prisma.usuario.findFirst({ where: { rol: 'admin', activo: true } })
      if (!admin) return NextResponse.json({ error: 'No hay admin configurado' }, { status: 403 })
      const bcrypt = await import('bcryptjs')
      const pinOk = await bcrypt.compare(pin, admin.password)
      if (!pinOk) return NextResponse.json({ error: 'PIN_WRONG', message: 'PIN de administrador incorrecto' }, { status: 403 })
    }
  }

  await prisma.cotizacion.update({
    where: { id: Number(params.id) },
    data: {
      estado,
      notas: estado === 'aceptada'
        ? `Autorizada por: ${session.user.name} el ${new Date().toLocaleString('es-GT')}`
        : undefined,
    },
  })

  try {
    await prisma.auditLog.create({
      data: {
        usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name,
        accion: `COTIZACION_${estado.toUpperCase()}`, tabla: 'cotizaciones',
        registroId: params.id, detalle: `Estado cambiado a: ${estado}`,
      }
    })
  } catch {}

  return NextResponse.json({ ok: true })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { clienteNombre, clienteDireccion, clienteTelefono, clienteNit, atencion, formaPago, descripcion, notas, items, subtotal, descuento, total, validezDias, tiempoInstalacion } = body

  try {
    await prisma.cotizacionItem.deleteMany({ where: { cotizacionId: Number(params.id) } })
    await prisma.cotizacion.update({
      where: { id: Number(params.id) },
      data: {
        clienteNombre, clienteDireccion, clienteTelefono, clienteNit, atencion, formaPago,
        descripcion, notas, tiempoInstalacion, subtotal, descuento, total,
        validezDias: validezDias || 15,
        items: {
          create: (items || []).map((it: any) => ({
            codigo: it.codigo || '',
            descripcion: it.descripcion,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
            subtotal: it.subtotal,
            descuento: it.descuento || 0,
            totalItem: it.totalItem,
          })),
        },
      },
    })
    try {
      await prisma.auditLog.create({ data: { usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name, accion: 'UPDATE', tabla: 'cotizaciones', registroId: params.id, detalle: 'Cotizacion editada' } })
    } catch {}
    const updated = await prisma.cotizacion.findUnique({ where: { id: Number(params.id) }, include: { items: true } })
    return NextResponse.json({ ok: true, cotizacion: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  await prisma.cotizacion.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
