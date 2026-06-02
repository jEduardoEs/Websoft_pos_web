import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const estado = searchParams.get('estado') || ''
    const where: any = {}
    if (estado) where.estado = estado
    // Auto-update vencidas
    await prisma.cuentaCobrar.updateMany({
      where: { estado: 'pendiente', fechaVencimiento: { lt: new Date() } },
      data: { estado: 'vencido' },
    })
    const cuentas = await prisma.cuentaCobrar.findMany({ where, orderBy: { fechaVencimiento: 'asc' } })
    const resumen = await prisma.cuentaCobrar.aggregate({ _sum: { monto: true, montoPagado: true } })
    return NextResponse.json({ cuentas, resumen })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const body = await req.json()
    const { clienteNombre, clienteNit, clienteTelefono, ventaNumero, concepto, monto, fechaVencimiento, notas } = body
    if (!clienteNombre || !monto || !fechaVencimiento) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    const count = await prisma.cuentaCobrar.count()
    const numero = `CC-${String(count + 1).padStart(6, '0')}`
    const cuenta = await prisma.cuentaCobrar.create({
      data: { numero, clienteNombre, clienteNit, clienteTelefono, ventaNumero, concepto, monto: +monto, fechaVencimiento: new Date(fechaVencimiento), notas, usuarioNombre: session.user.name },
    })
    return NextResponse.json({ ok: true, cuenta })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { id, montoPago, notas } = await req.json()
    const cuenta = await prisma.cuentaCobrar.findUnique({ where: { id: Number(id) } })
    if (!cuenta) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    const nuevoPagado = cuenta.montoPagado + Number(montoPago)
    const estado = nuevoPagado >= cuenta.monto ? 'pagado' : 'parcial'
    const updated = await prisma.cuentaCobrar.update({
      where: { id: Number(id) },
      data: { montoPagado: nuevoPagado, estado, notas: notas || cuenta.notas },
    })
    return NextResponse.json({ ok: true, cuenta: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
