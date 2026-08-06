import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ReporteBackendService } from '@/modules/reportes/services/reporte.backend.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const reporte = await ReporteBackendService.getReporteInventario();
    return NextResponse.json(reporte);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
