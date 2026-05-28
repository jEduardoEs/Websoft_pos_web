import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    // Get active apertura
    const activa = await prisma.aperturaCaja.findFirst({
      where: { estado: 'abierta' }, orderBy: { id: 'desc' }
    })

    // Get movimientos of active session
    let movimientos: any[] = []
    let ventasEfectivo = 0
    let ventasTarjeta = 0
    let ventasTransferencia = 0

    if (activa) {
      // Ventas desde apertura
      const ventas = await prisma.venta.findMany({
        where: { fecha: { gte: activa.fecha }, estado: 'completada' }
      })
      ventasEfectivo = ventas.filter(v => v.metodoPago === 'efectivo').reduce((s, v) => s + v.total, 0)
      ventasTarjeta = ventas.filter(v => v.metodoPago === 'tarjeta').reduce((s, v) => s + v.total, 0)
      ventasTransferencia = ventas.filter(v => v.metodoPago === 'transferencia').reduce((s, v) => s + v.total, 0)

      // Movimientos de esta apertura
      movimientos = await prisma.movimientoCaja.findMany({
        where: { aperturaId: activa.id },
        orderBy: { fecha: 'desc' }
      })
    }

    const totalInyecciones = movimientos.filter(m => m.tipo === 'inyeccion').reduce((s: number, m: any) => s + m.monto, 0)
    const totalRetiros = movimientos.filter(m => m.tipo === 'retiro').reduce((s: number, m: any) => s + m.monto, 0)

    // Lo que DEBE haber en caja (efectivo)
    const debeHaber = (activa?.fondoInicial || 0) + ventasEfectivo + totalInyecciones - totalRetiros

    return NextResponse.json({
      activa,
      movimientos,
      ventasEfectivo,
      ventasTarjeta,
      ventasTransferencia,
      numVentas: activa ? numVentas : 0,
      totalVentas: activa ? totalVentas : 0,
      totalInyecciones,
      totalRetiros,
      debeHaber,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { accion, fondo, notas, monto, motivo, efectivoContado } = body

  try {
    if (accion === 'abrir') {
      const activa = await prisma.aperturaCaja.findFirst({ where: { estado: 'abierta' } })
      if (activa) return NextResponse.json({ error: 'Ya hay una caja abierta' }, { status: 400 })
      const apertura = await prisma.aperturaCaja.create({
        data: { fondoInicial: +fondo || 0, usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name, notas }
      })
      return NextResponse.json({ ok: true, apertura })
    }

    if (accion === 'inyeccion' || accion === 'retiro') {
      const activa = await prisma.aperturaCaja.findFirst({ where: { estado: 'abierta' }, orderBy: { id: 'desc' } })
      if (!activa) return NextResponse.json({ error: 'No hay caja abierta' }, { status: 400 })
      if (!monto || +monto <= 0) return NextResponse.json({ error: 'Monto invalido' }, { status: 400 })
      await prisma.movimientoCaja.create({
        data: { tipo: accion, monto: +monto, motivo: motivo || '', aperturaId: activa.id, usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name }
      })
      return NextResponse.json({ ok: true })
    }

    if (accion === 'cerrar') {
      const activa = await prisma.aperturaCaja.findFirst({ where: { estado: 'abierta' }, orderBy: { id: 'desc' } })
      if (!activa) return NextResponse.json({ error: 'No hay caja abierta' }, { status: 400 })

      // Calc ventas
      const ventas = await prisma.venta.findMany({ where: { fecha: { gte: activa.fecha }, estado: 'completada' } })
      const efectivo = ventas.filter(v => v.metodoPago === 'efectivo').reduce((s, v) => s + v.total, 0)
      const tarjeta = ventas.filter(v => v.metodoPago === 'tarjeta').reduce((s, v) => s + v.total, 0)
      const transferencia = ventas.filter(v => v.metodoPago === 'transferencia').reduce((s, v) => s + v.total, 0)

      const movimientos = await prisma.movimientoCaja.findMany({ where: { aperturaId: activa.id } })
      const inyecciones = movimientos.filter(m => m.tipo === 'inyeccion').reduce((s, m) => s + m.monto, 0)
      const retiros = movimientos.filter(m => m.tipo === 'retiro').reduce((s, m) => s + m.monto, 0)

      const debeHaber = activa.fondoInicial + efectivo + inyecciones - retiros
      const contado = +efectivoContado || 0
      const diferencia = contado - debeHaber

      // Save cierre with all data
      const cierre = await prisma.cierre.create({
        data: {
          fechaInicio: activa.fecha, fechaFin: new Date(),
          totalVentas: ventas.length,
          totalEfectivo: efectivo, totalTarjeta: tarjeta, totalTransferencia: transferencia,
          granTotal: ventas.reduce((s, v) => s + v.total, 0),
          usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name,
          notas: `Fondo: Q${activa.fondoInicial} | Inyecciones: Q${inyecciones} | Retiros: Q${retiros} | Debe haber: Q${debeHaber.toFixed(2)} | Contado: Q${contado.toFixed(2)} | Diferencia: Q${diferencia.toFixed(2)} | ${notas || ''}`,
        }
      })

      await prisma.aperturaCaja.update({ where: { id: activa.id }, data: { estado: 'cerrada' } })

      return NextResponse.json({ ok: true, cierre, debeHaber, contado, diferencia, totalVentas: ventas.reduce((s,v) => s+v.total, 0) })
    }

    return NextResponse.json({ error: 'Accion invalida' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
