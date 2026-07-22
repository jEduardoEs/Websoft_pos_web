import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const proyecto = await prisma.proyecto.findUnique({
    where: { id: Number(params.id) },
    include: {
      mantenimientos: { orderBy: { numero: 'asc' } },
      garantias: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!proyecto) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(proyecto)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { accion, mantId, fechaRealizada, notas, cobrado, montoCobrado, tecnicoNombre, ...campos } = body

  // Marcar mantenimiento como realizado
  if (accion === 'marcar_mantenimiento' && mantId) {
    const mant = await prisma.mantenimientoProyecto.update({
      where: { id: Number(mantId) },
      data: {
        realizado: true,
        fechaRealizada: fechaRealizada ? new Date(fechaRealizada) : new Date(),
        notas: notas || null,
        cobrado: cobrado ?? false,
        montoCobrado: montoCobrado ? Number(montoCobrado) : 0,
        tecnicoNombre: tecnicoNombre || session.user.name,
      },
    })
    return NextResponse.json({ ok: true, mantenimiento: mant })
  }

  // Editar datos del proyecto
  const data: any = {}
  if (campos.nombre !== undefined)           data.nombre = campos.nombre
  if (campos.clienteNombre !== undefined)    data.clienteNombre = campos.clienteNombre
  if (campos.clienteTelefono !== undefined)  data.clienteTelefono = campos.clienteTelefono
  if (campos.clienteDireccion !== undefined) data.clienteDireccion = campos.clienteDireccion
  if (campos.clienteNit !== undefined)       data.clienteNit = campos.clienteNit
  if (campos.contactoNombre !== undefined)   data.contactoNombre = campos.contactoNombre
  if (campos.descripcion !== undefined)      data.descripcion = campos.descripcion
  if (campos.alcance !== undefined)          data.alcance = campos.alcance
  if (campos.estado !== undefined)           data.estado = campos.estado
  if (campos.fechaInicio !== undefined)      data.fechaInicio = new Date(campos.fechaInicio)
  if (campos.fechaFin !== undefined)         data.fechaFin = campos.fechaFin ? new Date(campos.fechaFin) : null
  if (notas !== undefined)                   data.notas = notas

  const proyecto = await prisma.proyecto.update({
    where: { id: Number(params.id) },
    data,
    include: { mantenimientos: { orderBy: { numero: 'asc' } } },
  })
  return NextResponse.json({ ok: true, proyecto })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  await prisma.proyecto.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
