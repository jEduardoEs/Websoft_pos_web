import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ContabilidadService } from '@/modules/contabilidad/services/ContabilidadService';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const res = await ContabilidadService.runSetup(session.user.name || 'Admin');
    return NextResponse.json({ ok: true, msg: res.msg });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}

