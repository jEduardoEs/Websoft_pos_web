import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ServicioBackendService } from '@/modules/servicio/services/servicio.backend.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const orden = await ServicioBackendService.findById(Number(params.id));
    if (!orden) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    return NextResponse.json(orden);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const { estado, comentario, ...data } = body;

    if (Object.keys(data).length > 0) {
      await ServicioBackendService.update(Number(params.id), data, session.user);
    }

    if (estado) {
      await ServicioBackendService.cambiarEstado(Number(params.id), estado, comentario, session.user);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    await ServicioBackendService.delete(Number(params.id), session.user);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: e.message === 'No autorizado' ? 401 : 500 });
  }
}
