import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ContabilidadService } from '@/modules/contabilidad/services/ContabilidadService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const fi = searchParams.get('fi') || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const ff = searchParams.get('ff') || new Date().toISOString().slice(0, 10);
    const tipo = searchParams.get('tipo') as 'pyg' | 'balance' || 'pyg';

    if (tipo !== 'pyg' && tipo !== 'balance') {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    const res = await ContabilidadService.getEstados(tipo, fi, ff);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

