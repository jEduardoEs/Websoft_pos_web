import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { VentaBackendService } from '@/modules/ventas/services/venta.backend.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const venta = await VentaBackendService.getVentaById(Number(params.id));
    return NextResponse.json(venta);
  } catch (e: any) {
    if (e.message === 'No encontrado') return NextResponse.json({ error: e.message }, { status: 404 });
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const motivo = body.motivo || 'Anulación';

    await VentaBackendService.anularVenta(Number(params.id), motivo, session.user);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'No encontrado') return NextResponse.json({ error: e.message }, { status: 404 });
    if (e.message === 'Ya anulada') return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
