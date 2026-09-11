import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ContabilidadService } from '@/modules/contabilidad/services/ContabilidadService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const fi = searchParams.get('fi') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const ff = searchParams.get('ff') || new Date().toISOString().slice(0, 10);
    const cuentaId = searchParams.get('cuentaId') ? Number(searchParams.get('cuentaId')) : undefined;

    const cuentas = await ContabilidadService.getMayor(fi, ff, cuentaId);
    return NextResponse.json({ cuentas, periodo: { fi, ff } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
