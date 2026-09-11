import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TiendaBackendService } from '@/modules/tienda/services/tienda.backend.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado') || undefined;

    const pedidos = await TiendaBackendService.getPedidos(estado);
    return NextResponse.json(pedidos);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pedido = await TiendaBackendService.createPedido(body);

    return NextResponse.json(
      { ok: true, pedido, numero: pedido.numero },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (e: any) {
    const status = e.message.includes('requeridos') || e.message.includes('vacío') || e.message.includes('stock') ? 400 : 500;
    return NextResponse.json({ error: e.message || 'Error interno' }, { status });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
