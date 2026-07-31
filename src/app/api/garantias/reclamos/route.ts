import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const garantiaId = searchParams.get('garantia_id')
    const where: any = {}
    if (garantiaId) where.garantiaId = Number(garantiaId)
    const reclamos = await prisma.reclamoGarantia.findMany({
      where, orderBy: { id: 'desc' }, take: 100,
    })
    return NextResponse.json(reclamos)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const {
      garantiaId, clienteNit, clienteDpi, clienteTelefono,
      motivoReclamo, descripcionFalla, tieneFactura, numeroFactura, notas,
    } = body

    if (!garantiaId || !motivoReclamo || !descripcionFalla) {
      return NextResponse.json({ error: 'Garantía, motivo y descripción son requeridos' }, { status: 400 })
    }

    const garantia = await prisma.garantia.findUnique({ where: { id: Number(garantiaId) } })
    if (!garantia) return NextResponse.json({ error: 'Garantía no encontrada' }, { status: 404 })
    if (garantia.estado === 'vencida') return NextResponse.json({ error: 'La garantía está vencida' }, { status: 400 })
    if (garantia.estado === 'reclamada') return NextResponse.json({ error: 'Esta garantía ya fue reclamada' }, { status: 400 })
    if (garantia.estado === 'anulada') return NextResponse.json({ error: 'Esta garantía está anulada' }, { status: 400 })

    const count = await prisma.reclamoGarantia.count()
    const numero = `REC-${String(count + 1).padStart(6, '0')}`

    const reclamo = await prisma.$transaction(async (tx) => {
      const r = await tx.reclamoGarantia.create({
        data: {
          numero,
          garantiaId: Number(garantiaId),
          garantiaNumero: garantia.numero,
          clienteNombre: garantia.clienteNombre,
          clienteNit: clienteNit || garantia.clienteNit,
          clienteDpi, clienteTelefono,
          productoNombre: garantia.productoNombre,
          productoSerie: garantia.productoSerie,
          motivoReclamo, descripcionFalla,
          tieneFactura: !!tieneFactura,
          numeroFactura: numeroFactura || garantia.ventaNumero,
          usuarioNombre: session.user.name,
          notas,
        },
      })
      // Mark garantia as reclamada
      await tx.garantia.update({
        where: { id: Number(garantiaId) },
        data: { estado: 'reclamada' },
      })
      return r
    })

    return NextResponse.json({ ok: true, reclamo })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
