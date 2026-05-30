import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const users = await prisma.usuario.findMany({
      select: { id: true, nombre: true, usuario: true, rol: true, permisos: true, activo: true, createdAt: true },
      orderBy: { nombre: 'asc' },
    })
    return NextResponse.json(users)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const body = await req.json()
    const { id, nombre, usuario, password, rol, permisos } = body

    if (!nombre || !usuario) {
      return NextResponse.json({ error: 'Nombre y usuario son requeridos' }, { status: 400 })
    }

    const permisosStr = Array.isArray(permisos) ? JSON.stringify(permisos) : (permisos || '')
    const { metaMensual } = body

    if (id) {
      const data: any = { nombre, usuario, rol: rol || 'cajero', permisos: permisosStr, metaMensual: parseFloat(metaMensual || '0') || 0 }
      if (password) data.password = await bcrypt.hash(password, 12)
      await prisma.usuario.update({ where: { id: Number(id) }, data })
      return NextResponse.json({ ok: true })
    }

    if (!password) {
      return NextResponse.json({ error: 'Contraseña requerida para nuevo usuario' }, { status: 400 })
    }

    await prisma.usuario.create({
      data: {
        nombre, usuario,
        password: await bcrypt.hash(password, 12),
        rol: rol || 'cajero',
        permisos: permisosStr,
        metaMensual: parseFloat(metaMensual || '0') || 0,
      },
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    if (Number(id) === parseInt(session.user.id)) {
      return NextResponse.json({ error: 'No puedes desactivarte a ti mismo' }, { status: 400 })
    }
    await prisma.usuario.update({ where: { id: Number(id) }, data: { activo: false } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
