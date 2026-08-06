import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionBackendService } from '@/modules/auth/services/session.backend.service';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ ok: false });
    
    await SessionBackendService.ping(parseInt(session.user.id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const result = await SessionBackendService.getAll();
    return NextResponse.json(result);
  } catch (e: any) {
    console.error('GET sessions error:', e.message);
    return NextResponse.json(
      { error: 'Tabla no existe. Ejecuta: npx prisma@5.22.0 db push', details: e.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const usuarioId = searchParams.get('usuario_id');
    if (!usuarioId) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    
    await SessionBackendService.closeSession(Number(usuarioId));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
