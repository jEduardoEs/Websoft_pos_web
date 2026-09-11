import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AuditoriaBackendService } from '@/modules/auditoria/services/auditoria.backend.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tabla = searchParams.get('tabla') || undefined;
    const accion = searchParams.get('accion') || undefined;
    const usuarioId = searchParams.get('usuario_id') ? parseInt(searchParams.get('usuario_id')!) : undefined;
    const desde = searchParams.get('desde') || undefined;
    const hasta = searchParams.get('hasta') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');

    const resultado = await AuditoriaBackendService.getLogs({
      tabla,
      accion,
      usuarioId,
      desde,
      hasta,
      limit,
    });

    return NextResponse.json(resultado);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
