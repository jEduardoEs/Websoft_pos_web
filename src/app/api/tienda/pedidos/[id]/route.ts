import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TiendaBackendService } from '@/modules/tienda/services/tienda.backend.service';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { accion } = await req.json();
    const result = await TiendaBackendService.updatePedido(Number(params.id), accion, session.user);

    if (accion === 'confirmar') {
      return NextResponse.json({ ok: true, venta: result });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'No encontrado') return NextResponse.json({ error: e.message }, { status: 404 });
    if (e.message === 'Acción inválida') return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
