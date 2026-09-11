import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CotizacionService } from '@/modules/cotizaciones/services/cotizacion.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const { cotizacionId, ...data } = body;

    const venta = await CotizacionService.facturar(Number(cotizacionId), data, session.user);

    return NextResponse.json({ ok: true, ventaId: venta.id });
  } catch (e: any) {
    if (e.message === 'Cotización no encontrada') return NextResponse.json({ error: e.message }, { status: 404 });
    if (e.message === 'Ya fue facturada') return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
