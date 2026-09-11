import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { descuentosRepository, validarDescuentoRules } from '@/modules/descuentos'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { codigo, total } = await req.json()
    if (!codigo) {
      return NextResponse.json({ ok: false, error: 'Código requerido' })
    }

    const descuento = await descuentosRepository.findByCodigo(codigo)
    const result = validarDescuentoRules(descuento, Number(total) || 0)

    return NextResponse.json(result)
  } catch (e: any) {
    console.error('descuentos/validar/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}