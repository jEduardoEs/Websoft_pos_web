import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { descuentosRepository } from '@/modules/descuentos'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const list = await descuentosRepository.findAll()
    return NextResponse.json(list)
  } catch (e: any) {
    console.error('descuentos/route.ts error:', e?.message)
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
    const { id, codigo, valor } = body
    if (!codigo || valor === undefined) {
      return NextResponse.json({ error: 'Código y valor requeridos' }, { status: 400 })
    }

    if (id) {
      await descuentosRepository.update(Number(id), body)
      return NextResponse.json({ ok: true })
    }

    await descuentosRepository.create(body)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('descuentos/route.ts error:', e?.message)
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

    await descuentosRepository.softDelete(Number(id))
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('descuentos/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { id, activo } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    await descuentosRepository.toggleActivo(Number(id), Boolean(activo))
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('PATCH descuentos error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}