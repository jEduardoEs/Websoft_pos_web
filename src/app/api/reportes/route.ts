import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ReporteBackendService } from '@/modules/reportes/services/reporte.backend.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const fechaIni = searchParams.get('fecha_ini');
    const fechaFin = searchParams.get('fecha_fin');

    const reporte = await ReporteBackendService.getReporteVentas(fechaIni, fechaFin);
    return NextResponse.json(reporte);
  } catch (e: any) {
    console.error('reportes/route.ts error:', e.message);
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}