import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CajaBackendService } from '@/modules/caja/services/caja.backend.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const cierres = await CajaBackendService.getCierres();
    return NextResponse.json(cierres);
  } catch (e: any) {
    console.error('cierres/route.ts error:', e.message);
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const { fechaInicio, fechaFin, notas } = await req.json();
    const cierre = await CajaBackendService.crearCierre(fechaInicio, fechaFin, notas, session.user);
    
    return NextResponse.json({ ok: true, cierre });
  } catch (e: any) {
    console.error('cierres/route.ts error:', e.message);
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}