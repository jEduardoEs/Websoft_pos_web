import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest)  {
  try {

    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const buscar = searchParams.get('buscar') || ''
    const estado = searchParams.get('estado') || ''

    const where: any = {}
    if (estado) where.estado = estado
    if (buscar) where.OR = [
      { clienteNombre: { contains: buscar, mode: 'insensitive' } },
      { productoNombre: { contains: buscar, mode: 'insensitive' } },
      { numero: { contains: buscar, mode: 'insensitive' } },
      { clienteNit: { contains: buscar, mode: 'insensitive' } },
    ]

    // Auto-update expired
    await prisma.garantia.updateMany({
      where: { estado: 'vigente', fechaVencimiento: { lt: new Date() } },
      data: { estado: 'vencida' },
    })

    const garantias = await prisma.garantia.findMany({ where, orderBy: { id: 'desc' }, take: 100 })
    return NextResponse.json(garantias)

  } catch (e: any) {
    console.error('garantias/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
export async function POST(req: NextRequest)  {
  try {

    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { clienteNombre, clienteTelefono, clienteNit, productoNombre, productoSerie, ventaNumero, ventaId, diasGarantia, fechaVenta, condiciones, notas } = body

    if (!clienteNombre || !productoNombre) {
      return NextResponse.json({ error: 'Cliente y producto son requeridos' }, { status: 400 })
    }

    const count = await prisma.garantia.count()
    const numero = `GAR-${String(count + 1).padStart(6, '0')}`
    const fVenta = fechaVenta ? new Date(fechaVenta) : new Date()
    const dias = +diasGarantia || 365
    const fVencimiento = new Date(fVenta.getTime() + dias * 24 * 60 * 60 * 1000)

    const garantia = await prisma.garantia.create({
      data: {
        numero, clienteNombre, clienteTelefono, clienteNit,
        productoNombre, productoSerie, ventaNumero,
        ventaId: ventaId ? Number(ventaId) : null,
        diasGarantia: dias, fechaVenta: fVenta,
        fechaVencimiento: fVencimiento, condiciones, notas,
        usuarioNombre: session.user.name,
      },
    })

    return NextResponse.json({ ok: true, garantia })

  } catch (e: any) {
    console.error('garantias/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}