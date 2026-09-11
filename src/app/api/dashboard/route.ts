import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DashboardBackendService } from '@/modules/dashboard/services/dashboard.backend.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const dashboardData = await DashboardBackendService.getDashboardData(session.user);
    return NextResponse.json(dashboardData);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
