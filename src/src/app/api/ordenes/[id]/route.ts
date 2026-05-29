import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest, 
  try {
   params }: { params: { id: string } }) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id: Number(params.id) },
      include: { repuestos: true, historial: { orderBy: { fecha: 'desc' } } },
    })
    if (!orden) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(orden)
  }

  } catch (e: any) {
    console.error('ordenes/[id]/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
export async function PATCH(req: NextRequest, 
  try {
   params }: { params: { id: string } }) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { estado, diagnostico, trabajoRealizado, costoReparacion, costoRepuestos, tecnicoNombre, comentario, fechaEntrega } = body

    const orden = await prisma.ordenTrabajo.findUnique({ where: { id: Number(params.id) } })
    if (!orden) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const total = (+costoReparacion || orden.costoReparacion) + (+costoRepuestos || orden.costoRepuestos)

    await prisma.$transaction(async (tx) => {
      await tx.ordenTrabajo.update({
        where: { id: Number(params.id) },
        data: {
          ...(estado && { estado }),
          ...(diagnostico !== undefined && { diagnostico }),
          ...(trabajoRealizado !== undefined && { trabajoRealizado }),
          ...(costoReparacion !== undefined && { costoReparacion: +costoReparacion, total }),
          ...(costoRepuestos !== undefined && { costoRepuestos: +costoRepuestos, total }),
          ...(tecnicoNombre !== undefined && { tecnicoNombre }),
          ...(estado === 'entregado' && { fechaEntrega: new Date() }),
          updatedAt: new Date(),
        },
      })
      if (estado && estado !== orden.estado) {
        await tx.ordenHistorial.create({
          data: {
            ordenId: Number(params.id),
            estadoAnterior: orden.estado,
            estadoNuevo: estado,
            comentario: comentario || `Estado cambiado a ${estado}`,
            usuarioNombre: session.user.name,
          },
        })
      }
    })

    return NextResponse.json({ ok: true })
  }

  } catch (e: any) {
    console.error('ordenes/[id]/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
export async function DELETE(req: NextRequest, 
  try {
   params }: { params: { id: string } }) {
    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    await prisma.ordenTrabajo.delete({ where: { id: Number(params.id) } })
    return NextResponse.json({ ok: true })
  }

  } catch (e: any) {
    console.error('ordenes/[id]/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}