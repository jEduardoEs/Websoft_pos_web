import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProyectoService } from '@/modules/proyectos/services/proyecto.service';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const proyecto = await ProyectoService.findById(Number(params.id));
    if (!proyecto) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(proyecto);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const { accion, mantId, pin, ...campos } = body;

    if (accion === 'marcar_mantenimiento' && mantId) {
      const mant = await ProyectoService.registerMantenimiento(
        Number(params.id),
        Number(mantId),
        campos,
        parseInt(session.user.id),
        session.user.name || 'API'
      );
      return NextResponse.json({ ok: true, mantenimiento: mant });
    }

    const proyecto = await ProyectoService.update(
      Number(params.id),
      { ...campos, pin },
      parseInt(session.user.id),
      session.user.name || 'API'
    );
    
    return NextResponse.json({ ok: true, proyecto });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    await ProyectoService.delete(Number(params.id), session.user.role || '', body.pin);
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: e.message.includes('Contraseña') ? 403 : 500 });
  }
}
