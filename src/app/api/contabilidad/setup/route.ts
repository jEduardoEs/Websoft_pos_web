import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const PLAN_CUENTAS = [
  // ACTIVOS
  { codigo: '1000', nombre: 'ACTIVOS', tipo: 'activo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '1100', nombre: 'Activo Corriente', tipo: 'activo', naturaleza: 'deudora', nivel: 2 },
  { codigo: '1101', nombre: 'Caja', tipo: 'activo', naturaleza: 'deudora', nivel: 3 },
  { codigo: '1102', nombre: 'Banco — Banrural', tipo: 'activo', naturaleza: 'deudora', nivel: 3 },
  { codigo: '1103', nombre: 'Banco — Banco Industrial', tipo: 'activo', naturaleza: 'deudora', nivel: 3 },
  { codigo: '1110', nombre: 'Cuentas por Cobrar', tipo: 'activo', naturaleza: 'deudora', nivel: 3 },
  { codigo: '1120', nombre: 'Inventario de Mercadería', tipo: 'activo', naturaleza: 'deudora', nivel: 3 },
  { codigo: '1130', nombre: 'IVA Crédito Fiscal', tipo: 'activo', naturaleza: 'deudora', nivel: 3 },
  { codigo: '1200', nombre: 'Activo Fijo', tipo: 'activo', naturaleza: 'deudora', nivel: 2 },
  { codigo: '1201', nombre: 'Mobiliario y Equipo', tipo: 'activo', naturaleza: 'deudora', nivel: 3 },
  { codigo: '1202', nombre: 'Equipo de Cómputo', tipo: 'activo', naturaleza: 'deudora', nivel: 3 },
  { codigo: '1203', nombre: 'Herramientas y Equipo Técnico', tipo: 'activo', naturaleza: 'deudora', nivel: 3 },
  { codigo: '1290', nombre: 'Depreciación Acumulada', tipo: 'activo', naturaleza: 'acreedora', nivel: 3 },
  // PASIVOS
  { codigo: '2000', nombre: 'PASIVOS', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '2100', nombre: 'Pasivo Corriente', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 2 },
  { codigo: '2101', nombre: 'Cuentas por Pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 3 },
  { codigo: '2102', nombre: 'IVA por Pagar (Débito Fiscal)', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 3 },
  { codigo: '2103', nombre: 'ISR por Pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 3 },
  { codigo: '2104', nombre: 'Sueldos por Pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 3 },
  // CAPITAL
  { codigo: '3000', nombre: 'CAPITAL', tipo: 'capital', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '3100', nombre: 'Capital Social', tipo: 'capital', naturaleza: 'acreedora', nivel: 2 },
  { codigo: '3200', nombre: 'Utilidades Retenidas', tipo: 'capital', naturaleza: 'acreedora', nivel: 2 },
  { codigo: '3300', nombre: 'Resultado del Ejercicio', tipo: 'capital', naturaleza: 'acreedora', nivel: 2 },
  // INGRESOS
  { codigo: '4000', nombre: 'INGRESOS', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1 },
  { codigo: '4100', nombre: 'Ventas de Mercadería', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 2 },
  { codigo: '4200', nombre: 'Ingresos por Servicios Técnicos', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 2 },
  { codigo: '4300', nombre: 'Ingresos por Instalaciones CCTV', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 2 },
  { codigo: '4400', nombre: 'Otros Ingresos', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 2 },
  // COSTOS
  { codigo: '5000', nombre: 'COSTO DE VENTAS', tipo: 'costo', naturaleza: 'deudora', nivel: 1 },
  { codigo: '5100', nombre: 'Costo de Mercadería Vendida', tipo: 'costo', naturaleza: 'deudora', nivel: 2 },
  { codigo: '5200', nombre: 'Costo de Materiales CCTV', tipo: 'costo', naturaleza: 'deudora', nivel: 2 },
  // GASTOS
  { codigo: '6000', nombre: 'GASTOS OPERATIVOS', tipo: 'gasto', naturaleza: 'deudora', nivel: 1 },
  { codigo: '6100', nombre: 'Sueldos y Salarios', tipo: 'gasto', naturaleza: 'deudora', nivel: 2 },
  { codigo: '6200', nombre: 'Alquiler', tipo: 'gasto', naturaleza: 'deudora', nivel: 2 },
  { codigo: '6300', nombre: 'Servicios Públicos', tipo: 'gasto', naturaleza: 'deudora', nivel: 2 },
  { codigo: '6400', nombre: 'Combustible y Transporte', tipo: 'gasto', naturaleza: 'deudora', nivel: 2 },
  { codigo: '6500', nombre: 'Depreciaciones', tipo: 'gasto', naturaleza: 'deudora', nivel: 2 },
  { codigo: '6600', nombre: 'Gastos de Publicidad', tipo: 'gasto', naturaleza: 'deudora', nivel: 2 },
  { codigo: '6700', nombre: 'Gastos Financieros', tipo: 'gasto', naturaleza: 'deudora', nivel: 2 },
  { codigo: '6900', nombre: 'Otros Gastos', tipo: 'gasto', naturaleza: 'deudora', nivel: 2 },
]

export async function POST() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const existing = await prisma.cuentaContable.count()
    if (existing > 0) return NextResponse.json({ ok: true, msg: 'Plan de cuentas ya existe', total: existing })

    await prisma.cuentaContable.createMany({ data: PLAN_CUENTAS })

    // Create current period
    const now = new Date()
    const inicio = new Date(now.getFullYear(), now.getMonth(), 1)
    const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    await prisma.periodoContable.create({
      data: { nombre: `${now.toLocaleString('es-GT', { month: 'long', year: 'numeric' })}`, fechaInicio: inicio, fechaFin: fin }
    })

    return NextResponse.json({ ok: true, msg: 'Plan de cuentas creado', total: PLAN_CUENTAS.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 })
  }
}
