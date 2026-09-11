import { NextRequest, NextResponse } from 'next/server';
import { TiendaBackendService } from '@/modules/tienda/services/tienda.backend.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get('categoria') || '';
    const buscar = searchParams.get('buscar') || '';
    const soloDisponibles = searchParams.get('disponibles') !== 'false';

    const result = await TiendaBackendService.getProductos(categoria, buscar, soloDisponibles);

    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    },
  });
}
