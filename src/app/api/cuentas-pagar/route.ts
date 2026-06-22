import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function crearAsiento(concepto: string, tipo: string, referenciaNum: string, partidas: { codigo: string; debe: number; haber: number; desc: string }[], usuarioNombre: string) {
  try {
    const cuentas = await prisma.cuentaContable.findMany({ where: { codigo: { in: partidas.map(p => p.codigo) } } })
    const codigoMap = Object.fromEntries(cuentas.map(c => [c.codigo, c.id]))
    const count = await prisma.asientoContable.count()
    await prisma.asientoContable.create({
      data: {
        numero: `ASI-${String(count + 1).padStart(6, '0')}`,
        concepto, tipo, referenciaNum, usuarioNombre,
        partidas: {
          create: partidas.map(p => ({
            cuentaId: codigoMap[p.codigo] || 0,
            debe: p.debe,
            haber: p.haber,
            descripcion: p.desc,
          })),
        },
      },
    })
  } catch { /* si no hay catálogo contable configurado, no falla */ }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const estado = searchParams.get('estado') || ''
    const where: any = {}
    if (estado) where.estado = estado
    await prisma.cuentaPagar.updateMany({
      where: { estado: 'pendiente', fechaVencimiento: { lt: new Date() } },
      data: { estado: 'vencido' },
    })
    const cuentas = await prisma.cuentaPagar.findMany({ where, orderBy: { fechaVencimiento: 'asc' } })
    const resumen = await prisma.cuentaPagar.aggregate({ _sum: { monto: true, montoPagado: true } })
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
    const { proveedorNombre, proveedorNit, proveedorTelefono, facturaNumero, concepto, monto, fechaVencimiento, notas } = body
    if (!proveedorNombre || !monto || !fechaVencimiento) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    const count = await prisma.cuentaPagar.count()
    const numero = `CP-${String(count + 1).padStart(6, '0')}`
    const cuenta = await prisma.cuentaPagar.create({
      data: { numero, proveedorNombre, proveedorNit, proveedorTelefono, facturaNumero, concepto, monto: +monto, fechaVencimiento: new Date(fechaVencimiento), notas, usuarioNombre: session.user.name },
    })
    // Asiento: Debe 1120 Inventario / Haber 2101 C×P
    await crearAsiento(
      `Cuenta por pagar ${numero} — ${proveedorNombre}`, 'pago', numero,
      [
        { codigo: '1120', debe: +monto, haber: 0,     desc: `Compra a crédito — ${concepto || proveedorNombre}` },
        { codigo: '2101', debe: 0,      haber: +monto, desc: `Deuda con ${proveedorNombre} — ${numero}` },
      ],
      session.user.name
    )
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
    const cuenta = await prisma.cuentaPagar.findUnique({ where: { id: Number(id) } })
    if (!cuenta) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    const nuevoPagado = cuenta.montoPagado + Number(montoPago)
    const estado = nuevoPagado >= cuenta.monto ? 'pagado' : 'parcial'
    const updated = await prisma.cuentaPagar.update({
      where: { id: Number(id) },
      data: { montoPagado: nuevoPagado, estado, notas: notas || cuenta.notas },
    })
    // Asiento: Debe 2101 C×P / Haber 1101 Caja
    await crearAsiento(
      `Pago a proveedor ${cuenta.numero} — ${cuenta.proveedorNombre}`, 'pago', cuenta.numero,
      [
        { codigo: '2101', debe: Number(montoPago), haber: 0,                desc: `Rebaje C×P ${cuenta.numero} — ${cuenta.proveedorNombre}` },
        { codigo: '1101', debe: 0,                 haber: Number(montoPago), desc: `Pago a ${cuenta.proveedorNombre}` },
      ],
      session.user.name
    )
    return NextResponse.json({ ok: true, cuenta: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
