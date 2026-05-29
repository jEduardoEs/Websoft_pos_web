import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() 
  try {

    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const rows = await prisma.config.findMany()
    const cfg: Record<string, string> = {}
    rows.forEach(r => { cfg[r.clave] = r.valor })
    return NextResponse.json(cfg)
  }

  } catch (e: any) {
    console.error('config/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
export async function POST(req: NextRequest) 
  try {

    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const body = await req.json()
    await Promise.all(Object.entries(body).map(([clave, valor]) =>
      prisma.config.upsert({ where: { clave }, update: { valor: String(valor) }, create: { clave, valor: String(valor) } })
    ))
    return NextResponse.json({ ok: true })
  }

  } catch (e: any) {
    console.error('config/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}