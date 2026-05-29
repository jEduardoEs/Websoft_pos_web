import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) 
  try {

    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const buscar = searchParams.get('buscar') || ''
    const where: any = { activo: true }
    if (buscar) where.OR = [{ nombre: { contains: buscar, mode: 'insensitive' } }, { nit: { contains: buscar, mode: 'insensitive' } }]
    return NextResponse.json(await prisma.proveedor.findMany({ where, orderBy: { nombre: 'asc' } }))
  }

  } catch (e: any) {
    console.error('proveedores/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
export async function POST(req: NextRequest) 
  try {

    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const body = await req.json()
    const { id, nombre, nit, telefono, email, direccion, contacto, notas } = body
    if (!nombre) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    if (id) {
      await prisma.proveedor.update({ where: { id: Number(id) }, data: { nombre, nit, telefono, email, direccion, contacto, notas } })
      return NextResponse.json({ ok: true })
    }
    await prisma.proveedor.create({ data: { nombre, nit, telefono, email, direccion, contacto, notas } })
    return NextResponse.json({ ok: true })
  }

  } catch (e: any) {
    console.error('proveedores/route.ts error:', e?.message)
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
    await prisma.proveedor.update({ where: { id: Number(id) }, data: { activo: false } })
    return NextResponse.json({ ok: true })
  }

  } catch (e: any) {
    console.error('proveedores/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}