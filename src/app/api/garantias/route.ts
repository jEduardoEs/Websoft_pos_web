import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GarantiaBackendService } from '@/modules/garantias/services/garantia.backend.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const buscar = searchParams.get('buscar') || '';
    const estado = searchParams.get('estado') || '';

    const garantias = await GarantiaBackendService.findAll({ buscar, estado });
    return NextResponse.json(garantias);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const garantia = await GarantiaBackendService.create(body, session.user.name || 'API');

    return NextResponse.json({ ok: true, garantia });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: e.message === 'Cliente y producto son requeridos' ? 400 : 500 });
  }
}