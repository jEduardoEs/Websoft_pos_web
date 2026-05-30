import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { estado, decision, resolucion, crearOrden } = body

    const reclamo = await prisma.reclamoGarantia.findUnique({ where: { id: Number(params.id) } })
    if (!reclamo) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    let ordenTrabajoId = reclamo.ordenTrabajoId

    await prisma.$transaction(async (tx) => {
      // If decision is reparar and no orden yet, create one automatically
      if (decision === 'reparar' && !ordenTrabajoId && crearOrden) {
        const count = await tx.ordenTrabajo.count()
        const numero = `OT-${String(count + 1).padStart(6, '0')}`
        const orden = await tx.ordenTrabajo.create({
          data: {
            numero,
            clienteNombre: reclamo.clienteNombre,
            clienteTelefono: reclamo.clienteTelefono,
            clienteNit: reclamo.clienteNit,
            tipoEquipo: reclamo.productoNombre,
            serie: reclamo.productoSerie,
            descripcionFalla: `GARANTÍA ${reclamo.garantiaNumero}: ${reclamo.descripcionFalla}`,
            observaciones: `Reclamo ${reclamo.numero} — ${reclamo.motivoReclamo}`,
            prioridad: 'urgente',
            usuarioId: parseInt(session.user.id),
            usuarioNombre: session.user.name,
            historial: {
              create: {
                estadoNuevo: 'recibido',
                comentario: `Creado desde reclamo de garantía ${reclamo.numero}`,
                usuarioNombre: session.user.name,
              },
            },
          },
        })
        ordenTrabajoId = orden.id
      }

      await tx.reclamoGarantia.update({
        where: { id: Number(params.id) },
        data: {
          ...(estado && { estado }),
          ...(decision && { decision }),
          ...(resolucion && { resolucion }),
          ...(ordenTrabajoId && { ordenTrabajoId }),
        },
      })
    })

    return NextResponse.json({ ok: true, ordenTrabajoId })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
