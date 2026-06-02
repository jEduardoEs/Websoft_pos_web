import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { soloSinCodigo } = await req.json()

    // Get prefix from config
    const cfg = await prisma.config.findUnique({ where: { clave: 'producto_prefijo' } })
    const prefix = cfg?.valor || 'WSP'

    // Get products to update
    const where = soloSinCodigo
      ? { OR: [{ codigo: null }, { codigo: '' }] }
      : {}
    const productos = await prisma.producto.findMany({
      where, orderBy: { id: 'asc' }, select: { id: true, nombre: true, codigo: true },
    })

    if (productos.length === 0) {
      return NextResponse.json({ ok: true, actualizados: 0, mensaje: 'Todos los productos ya tienen código' })
    }

    // Get ALL currently used numbers for this prefix
    const todos = await prisma.producto.findMany({
      where: { codigo: { startsWith: prefix + '-' } },
      select: { codigo: true },
    })
    const usados = new Set<number>()
    todos.forEach(p => {
      const n = parseInt(p.codigo?.replace(prefix + '-', '') || '0')
      if (!isNaN(n) && n > 0) usados.add(n)
    })

    // Build a generator that yields unused numbers starting from 1
    // filling gaps first, then continuing after max
    function* numerosLibres() {
      let n = 1
      while (true) {
        if (!usados.has(n)) yield n
        n++
      }
    }

    const gen = numerosLibres()
    const updates: { id: number; codigo: string; nombre: string }[] = []

    for (const prod of productos) {
      const n = gen.next().value as number
      const codigo = `${prefix}-${String(n).padStart(4, '0')}`
      // Mark as used so next product doesn't get same number
      usados.add(n)
      updates.push({ id: prod.id, codigo, nombre: prod.nombre })
    }

    // Apply all updates in one transaction
    await prisma.$transaction(
      updates.map(u => prisma.producto.update({
        where: { id: u.id },
        data: { codigo: u.codigo },
      }))
    )

    return NextResponse.json({
      ok: true,
      actualizados: updates.length,
      prefijo: prefix,
      productos: updates,
      mensaje: `${updates.length} productos actualizados con prefijo ${prefix}`,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
