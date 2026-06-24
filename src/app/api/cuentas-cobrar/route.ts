import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function crearAsiento(concepto: string, tipo: string, referenciaNum: string, partidas: { codigo: string; debe: number; haber: number; desc: string }[], usuarioNombre: string) {
  try {
    const cuentas = await prisma.cuentaContable.findMany({ where: { codigo: { in: partidas.map(p => p.codigo) } } })
    const codigoMap = Object.fromEntries(cuentas.map((c: any) => [c.codigo, c.id]))
    const count = await prisma.asientoContable.count()
    await prisma.asientoContable.create({
      data: {
        numero: `ASI-${String(count + 1).padStart(6, '0')}`,
        concepto, tipo, referenciaNum, usuarioNombre,
        partidas: { create: partidas.map((p: any) => ({ cuentaId: codigoMap[p.codigo] || 0, debe: p.debe, haber: p.haber, descripcion: p.desc })) },
      },
    })
  } catch { /* sin catálogo contable configurado, no falla */ }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const estado = new URL(req.url).searchParams.get('estado') || ''
    await prisma.cuentaCobrar.updateMany({ where: { estado: 'pendiente', fechaVencimiento: { lt: new Date() } }, data: { estado: 'vencido' } })
    const cuentas = await prisma.cuentaCobrar.findMany({ where: estado ? { estado } : {}, orderBy: { fechaVencimiento: 'asc' } })
    const resumen = await prisma.cuentaCobrar.aggregate({ _sum: { monto: true, montoPagado: true } })
    return NextResponse.json({ cuentas, resumen })
  } catch (e: any) { return NextResponse.json({ error: e?.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { clienteNombre, clienteNit, clienteTelefono, ventaNumero, concepto, monto, fechaVencimiento, notas } = await req.json()
    if (!clienteNombre || !monto || !fechaVencimiento) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    const numero = `CC-${String((await prisma.cuentaCobrar.count()) + 1).padStart(6, '0')}`
    const cuenta = await prisma.cuentaCobrar.create({
      data: { numero, clienteNombre, clienteNit, clienteTelefono, ventaNumero, concepto, monto: +monto, fechaVencimiento: new Date(fechaVencimiento), notas, usuarioNombre: session.user.name },
    })
    await crearAsiento(`C×C ${numero} — ${clienteNombre}`, 'cobro', numero,
      [{ codigo: '1110', debe: +monto, haber: 0, desc: `${concepto} — ${clienteNombre}` },
       { codigo: '4100', debe: 0, haber: +monto, desc: `Ingreso ${numero}` }], session.user.name)
    return NextResponse.json({ ok: true, cuenta })
  } catch (e: any) { return NextResponse.json({ error: e?.message }, { status: 500 }) }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { id, montoPago, notas } = await req.json()
    const cuenta = await prisma.cuentaCobrar.findUnique({ where: { id: Number(id) } })
    if (!cuenta) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    const nuevoPagado = cuenta.montoPagado + Number(montoPago)
    const updated = await prisma.cuentaCobrar.update({
      where: { id: Number(id) },
      data: { montoPagado: nuevoPagado, estado: nuevoPagado >= cuenta.monto ? 'pagado' : 'parcial', notas: notas || cuenta.notas },
    })
    await crearAsiento(`Cobro ${cuenta.numero} — ${cuenta.clienteNombre}`, 'cobro', cuenta.numero,
      [{ codigo: '1101', debe: Number(montoPago), haber: 0, desc: `Cobro — ${cuenta.clienteNombre}` },
       { codigo: '1110', debe: 0, haber: Number(montoPago), desc: `Rebaje C×C ${cuenta.numero}` }], session.user.name)
    return NextResponse.json({ ok: true, cuenta: updated })
  } catch (e: any) { return NextResponse.json({ error: e?.message }, { status: 500 }) }
}
