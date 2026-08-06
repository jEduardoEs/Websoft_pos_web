import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ReclamoBackendService } from '@/modules/garantias/services/reclamo.backend.service';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const ordenTrabajoId = await ReclamoBackendService.update(Number(params.id), body, session.user);

    return NextResponse.json({ ok: true, ordenTrabajoId });
  } catch (e: any) {
    if (e.message === 'No encontrado') return NextResponse.json({ error: e.message }, { status: 404 });
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
