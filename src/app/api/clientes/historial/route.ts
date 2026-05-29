import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest)  {
  try {

    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const nit = searchParams.get('nit') || ''
    const nombre = searchParams.get('nombre') || ''

    if (!nit && !nombre) return NextResponse.json({ error: 'NIT o nombre requerido' }, { status: 400 })

    const where: any = { estado: 'completada' }
    if (nit && nit !== 'CF') where.clienteNit = { contains: nit, mode: 'insensitive' }
    else if (nombre) where.clienteNombre = { contains: nombre, mode: 'insensitive' }

    const ventas = await prisma.venta.findMany({
      where, orderBy: { fecha: 'desc' }, take: 50,
      include: { items: true },
    })

    const totalCompras = ventas.reduce((s, v) => s + v.total, 0)
    const garantias = nit && nit !== 'CF'
      ? await prisma.garantia.findMany({ where: { clienteNit: { contains: nit, mode: 'insensitive' }, estado: 'vigente' } })
      : []
    const ordenes = nombre
      ? await prisma.ordenTrabajo.findMany({ where: { clienteNombre: { contains: nombre, mode: 'insensitive' } }, orderBy: { id: 'desc' }, take: 10 })
      : []

    return NextResponse.json({
      ventas, totalCompras, numCompras: ventas.length,
      garantias, ordenes,
      cliente: ventas[0] ? { nombre: ventas[0].clienteNombre, nit: ventas[0].clienteNit } : null,
    })

  } catch (e: any) {
    console.error('clientes/historial/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}