import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ConfigBackendService } from '@/modules/configuracion/services/config.backend.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const cfg = await ConfigBackendService.getConfig();
    return NextResponse.json(cfg);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const body = await req.json();
    await ConfigBackendService.setConfig(body);
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
