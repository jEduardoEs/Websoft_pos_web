import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { KardexService } from '@/modules/inventario/services/kardex.service'
import { ajusteStockSchema } from '@/modules/inventario/validators/kardex.validator'

export const dynamic = 'force-dynamic'

const kardexService = new KardexService();

export async function GET(req: NextRequest)  {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    
    const { searchParams } = new URL(req.url)
    const productoId = searchParams.get('producto_id')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
    
    if (!productoId) {
      return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 })
    }

    const data = await kardexService.getKardexByProductoId(Number(productoId), limit);
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('kardex/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest)  {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    
    const body = await req.json()
    const parsed = ajusteStockSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessage = parsed.error.errors.map(e => e.message).join(', ');
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const result = await kardexService.aplicarAjuste(
      parsed.data, 
      parseInt(session.user.id), 
      session.user.name || 'Admin'
    );
    
    return NextResponse.json(result);
  } catch (e: any) {
    console.error('kardex/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}