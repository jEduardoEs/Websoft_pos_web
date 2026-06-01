import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest)  {
  try {

    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { codigo, total } = await req.json()
    const d = await prisma.descuento.findUnique({ where: { codigo: codigo.toUpperCase(), activo: true } })

    if (!d) return NextResponse.json({ ok: false, error: 'Código no válido' })

    const now = new Date()
    if (d.fechaInicio && now < d.fechaInicio) return NextResponse.json({ ok: false, error: 'El descuento aún no está vigente' })
    if (d.fechaFin && now > d.fechaFin) return NextResponse.json({ ok: false, error: 'El descuento expiró' })
    if (d.minimoCompra && total < d.minimoCompra) return NextResponse.json({ ok: false, error: `Mínimo de compra: Q ${d.minimoCompra}` })
    if (d.usosMaximos > 0 && d.usosActuales >= d.usosMaximos) return NextResponse.json({ ok: false, error: 'Código agotado' })

    const porcentaje = d.tipo === 'porcentaje' ? d.valor : (d.valor / total * 100)
    return NextResponse.json({ ok: true, porcentaje, descuento: d })

  } catch (e: any) {
    console.error('descuentos/validar/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}