import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CotizacionService } from '@/modules/cotizaciones/services/cotizacion.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const c = await CotizacionService.findById(Number(params.id));
    if (!c) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(c);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const estado = body.estado;
    const pin = body.pin || body.pinAdmin;
    const updated = await CotizacionService.updateEstado(Number(params.id), estado, session.user, pin);

    return NextResponse.json({ ok: true, cotizacion: updated });
  } catch (e: any) {
    if (e.message === 'PIN_REQUIRED') return NextResponse.json({ error: 'PIN_REQUIRED', message: 'Requiere autorizacion del administrador' }, { status: 403 });
    if (e.message === 'PIN_WRONG') return NextResponse.json({ error: 'PIN_WRONG', message: 'PIN de administrador incorrecto' }, { status: 403 });
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: e.message.includes('admin configurado') ? 403 : 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const updated = await CotizacionService.updateFull(Number(params.id), body, session.user);

    return NextResponse.json({ ok: true, cotizacion: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    await CotizacionService.delete(Number(params.id), session.user);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: e.message === 'No autorizado' ? 401 : 500 });
  }
}
