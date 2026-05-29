import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) 
  try {

    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const nit = searchParams.get('nit')
    if (!nit) return NextResponse.json({ encontrado: false })
    const cliente = await prisma.cliente.findFirst({
      where: { nit: { equals: nit, mode: 'insensitive' }, activo: true }
    })
    if (cliente) return NextResponse.json({ encontrado: true, cliente })
    return NextResponse.json({ encontrado: false })
  }

  } catch (e: any) {
    console.error('clientes/buscar-nit/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}