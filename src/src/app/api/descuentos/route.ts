import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() 
  try {

    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    return NextResponse.json(await prisma.descuento.findMany({ orderBy: { id: 'desc' } }))
  }

  } catch (e: any) {
    console.error('descuentos/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
export async function POST(req: NextRequest) 
  try {

    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const body = await req.json()
    const { id, codigo, descripcion, tipo, valor, minimoCompra, usosMaximos, fechaInicio, fechaFin } = body
    if (!codigo || !valor) return NextResponse.json({ error: 'Código y valor requeridos' }, { status: 400 })
    if (id) {
      await prisma.descuento.update({ where: { id: Number(id) }, data: { codigo: codigo.toUpperCase(), descripcion, tipo, valor: +valor, minimoCompra: +minimoCompra || 0, usosMaximos: +usosMaximos || 0, fechaInicio: fechaInicio ? new Date(fechaInicio) : null, fechaFin: fechaFin ? new Date(fechaFin) : null } })
      return NextResponse.json({ ok: true })
    }
    await prisma.descuento.create({ data: { codigo: codigo.toUpperCase(), descripcion, tipo: tipo || 'porcentaje', valor: +valor, minimoCompra: +minimoCompra || 0, usosMaximos: +usosMaximos || 0, fechaInicio: fechaInicio ? new Date(fechaInicio) : null, fechaFin: fechaFin ? new Date(fechaFin) : null } })
    return NextResponse.json({ ok: true })
  }

  } catch (e: any) {
    console.error('descuentos/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
export async function DELETE(req: NextRequest) 
  try {

    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    await prisma.descuento.update({ where: { id: Number(id) }, data: { activo: false } })
    return NextResponse.json({ ok: true })
  }

  } catch (e: any) {
    console.error('descuentos/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}