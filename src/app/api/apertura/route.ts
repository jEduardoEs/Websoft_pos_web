import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CajaBackendService } from '@/modules/caja/services/caja.backend.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const activa = await CajaBackendService.getAperturaActiva();
    return NextResponse.json({ activa });
  } catch (e: any) {
    console.error('apertura/route.ts error:', e.message);
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const { accion, fondo, notas } = await req.json();

    if (accion === 'abrir') {
      await CajaBackendService.abrirCaja(fondo, notas, session.user);
      return NextResponse.json({ ok: true });
    }

    if (accion === 'cerrar') {
      await CajaBackendService.cerrarCaja(notas);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (e: any) {
    console.error('apertura/route.ts error:', e.message);
    if (e.message === 'Ya hay una caja abierta' || e.message === 'No hay caja abierta') {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}