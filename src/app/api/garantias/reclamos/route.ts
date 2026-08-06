import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ReclamoBackendService } from '@/modules/garantias/services/reclamo.backend.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const garantiaId = searchParams.get('garantia_id') || undefined;

    const reclamos = await ReclamoBackendService.findAll({ garantiaId });
    return NextResponse.json(reclamos);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const reclamo = await ReclamoBackendService.create(body, session.user);

    return NextResponse.json({ ok: true, reclamo });
  } catch (e: any) {
    if (e.message === 'Garantía no encontrada') return NextResponse.json({ error: e.message }, { status: 404 });
    if (e.message.includes('Garantía, motivo') || e.message.includes('vencida') || e.message.includes('reclamada') || e.message.includes('anulada')) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
