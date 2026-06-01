import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PUBLIC endpoint - no auth required - consumed by landing page
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoria = searchParams.get('categoria') || ''
    const buscar = searchParams.get('buscar') || ''
    const soloDisponibles = searchParams.get('disponibles') !== 'false'

    const where: any = { activo: true }
    if (soloDisponibles) where.stock = { gt: 0 }
    if (categoria) where.categoria = categoria
    if (buscar) where.OR = [
      { nombre: { contains: buscar, mode: 'insensitive' } },
      { descripcion: { contains: buscar, mode: 'insensitive' } },
      { codigo: { contains: buscar, mode: 'insensitive' } },
    ]

    const productos = await prisma.producto.findMany({
      where,
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        precio: true,
        stock: true,
        categoria: true,
        imagenUrl: true,
      },
    })

    // Get all categories for filter
    const categorias = await prisma.producto.findMany({
      where: { activo: true },
      select: { categoria: true },
      distinct: ['categoria'],
    })

    // CORS headers so landing can call this API
    return NextResponse.json(
      { productos, categorias: categorias.map(c => c.categoria).filter(Boolean) },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    },
  })
}
