import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DevolucionService } from '@/modules/devoluciones/services/devolucion.service';
import { createDevolucionDto } from '@/modules/devoluciones/dto/create-devolucion.dto';

export const dynamic = 'force-dynamic';

/** List all devoluciones */
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const devoluciones = await DevolucionService.findAll();
    return NextResponse.json(devoluciones);
  } catch (e: any) {
    console.error('GET devoluciones error:', e);
    return NextResponse.json({ error: e?.message || 'Error al obtener devoluciones' }, { status: 500 });
  }
}

/** Create a new devolucion */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const validation = createDevolucionDto.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }
    const usuarioId = parseInt(session.user.id);
    const usuarioNombre = session.user.name || 'Desconocido';
    const devolucion = await DevolucionService.create(validation.data, usuarioId, usuarioNombre);
    return NextResponse.json({ ok: true, devolucion });
  } catch (e: any) {
    console.error('POST devolucion error:', e);
    return NextResponse.json({ error: e?.message || 'Error interno del servidor' }, { status: 500 });
  }
}

/** Approve a devolucion */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { id, action } = await req.json(); // action: 'aprobar' | 'anular'
    if (!id || !action) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    let result;
    if (action === 'aprobar') {
      result = await DevolucionService.aprobar(Number(id));
    } else if (action === 'anular') {
      result = await DevolucionService.anular(Number(id));
    } else {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, devolucion: result });
  } catch (e: any) {
    console.error('PATCH devolucion error:', e);
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}