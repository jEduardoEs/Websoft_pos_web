import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ZonasBackendService } from '@/modules/configuracion/services/zonas.backend.service';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const body = await req.json();
    const zona = await ZonasBackendService.actualizarZona(Number(params.id), body);
    
    return NextResponse.json({ ok: true, zona });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    await ZonasBackendService.eliminarZona(Number(params.id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
