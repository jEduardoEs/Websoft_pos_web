import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PresupuestoBackendService } from '@/modules/presupuesto/services/presupuesto.backend.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const anio = parseInt(searchParams.get('anio') || String(new Date().getFullYear()));

    const resultado = await PresupuestoBackendService.getPresupuestoAnual(anio);
    return NextResponse.json(resultado);
  } catch (e: any) {
    console.error('presupuesto/route.ts error:', e.message);
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { anio, mes, meta, notas } = await req.json();
    if (!anio || !mes || meta === undefined) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });

    const presupuesto = await PresupuestoBackendService.setMeta(Number(anio), Number(mes), Number(meta), notas);
    return NextResponse.json({ ok: true, presupuesto });
  } catch (e: any) {
    console.error('presupuesto/route.ts error:', e.message);
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}