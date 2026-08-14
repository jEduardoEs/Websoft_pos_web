import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GarantiaBackendService } from '@/modules/garantias/services/garantia.backend.service';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const { estado, proyectoId } = body;

    if (estado === 'anulada' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado. Solo el administrador puede anular garantías.' }, { status: 403 });
    }

    const data: any = {};
    if (estado !== undefined) data.estado = estado;
    if (proyectoId !== undefined) data.proyectoId = proyectoId ? Number(proyectoId) : null;

    await GarantiaBackendService.update(Number(params.id), data);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado. Solo el administrador puede eliminar garantías.' }, { status: 403 });
    }

    await GarantiaBackendService.delete(Number(params.id), session.user.role);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
