import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ContabilidadService } from '@/modules/contabilidad/services/ContabilidadService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const periodos = await ContabilidadService.getPeriodos();
    return NextResponse.json(periodos);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const body = await req.json();
    const periodo = await ContabilidadService.createPeriodo(body);
    return NextResponse.json({ ok: true, periodo });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { id, accion } = await req.json();
    const userName = session.user.name || 'Admin';
    // Action is basically toggling it
    const periodo = await ContabilidadService.togglePeriodoEstado(Number(id), userName);
    return NextResponse.json({ ok: true, periodo });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
