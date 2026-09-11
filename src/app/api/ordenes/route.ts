import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ServicioBackendService } from '@/modules/servicio/services/servicio.backend.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado') || '';
    const buscar = searchParams.get('buscar') || '';

    const ordenes = await ServicioBackendService.findAll({ estado, buscar });
    return NextResponse.json(ordenes);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const orden = await ServicioBackendService.create(body, session.user);

    return NextResponse.json({ ok: true, orden });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: e.message === 'Cliente, equipo y falla son requeridos' ? 400 : 500 });
  }
}