import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ActivosService } from '@/modules/contabilidad/services/ActivosService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const res = await ActivosService.getActivos();
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const body = await req.json();
    
    const activo = await ActivosService.createActivo(body);
    return NextResponse.json({ ok: true, activo });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
