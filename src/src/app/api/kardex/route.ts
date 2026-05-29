import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) 
  try {

    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const productoId = searchParams.get('producto_id')
    const where: any = {}
    if (productoId) where.productoId = Number(productoId)
    return NextResponse.json(await prisma.kardex.findMany({ where, orderBy: { id: 'desc' }, take: 100 }))
  }

  } catch (e: any) {
    console.error('kardex/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
export async function POST(req: NextRequest) 
  try {

    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { productoId, cantidad, tipo, motivo } = await req.json()
    const prod = await prisma.producto.findUnique({ where: { id: Number(productoId) } })
    if (!prod) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    const newStock = tipo === 'entrada' ? prod.stock + cantidad : Math.max(0, prod.stock - cantidad)
    await prisma.$transaction([
      prisma.producto.update({ where: { id: prod.id }, data: { stock: newStock } }),
      prisma.kardex.create({ data: { productoId: prod.id, tipo, cantidad, stockAntes: prod.stock, stockDespues: newStock, motivo, usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name } }),
    ])
    return NextResponse.json({ ok: true, newStock })
  }

  } catch (e: any) {
    console.error('kardex/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}