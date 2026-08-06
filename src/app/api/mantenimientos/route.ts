import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { MantenimientoService } from '@/modules/mantenimientos/services/mantenimiento.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const data = await MantenimientoService.findAll();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const m = await MantenimientoService.create(body);
    
    return NextResponse.json({ ok: true, mantenimiento: m });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: e.message === 'Datos incompletos' ? 400 : 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const { id, mant, notas } = body;

    const updated = await MantenimientoService.updateStatus(Number(id), mant, notas);
    return NextResponse.json({ ok: true, mantenimiento: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: e.message === 'No encontrado' ? 404 : 500 });
  }
}
