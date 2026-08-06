import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ZonasBackendService } from '@/modules/configuracion/services/zonas.backend.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const { searchParams } = new URL(req.url);
    const soloActivas = searchParams.get('activas') === 'true';
    
    const zonas = await ZonasBackendService.getZonas(soloActivas);
    return NextResponse.json({ zonas });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const body = await req.json();
    const zona = await ZonasBackendService.crearZona(body);
    
    return NextResponse.json({ ok: true, zona });
  } catch (e: any) {
    if (e.message === 'Nombre y departamento son requeridos') {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
