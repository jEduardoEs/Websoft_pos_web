import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { OperationalDashboardService } from '@/modules/dashboard/services/OperationalDashboardService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const metrics = await OperationalDashboardService.getOperationalMetrics();
    return NextResponse.json({ ok: true, data: metrics });
  } catch (error: any) {
    console.error('[OperationalDashboard API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener métricas operativas' },
      { status: 500 }
    );
  }
}
