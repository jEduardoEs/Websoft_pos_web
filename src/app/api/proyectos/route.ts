import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProyectoService } from '@/modules/proyectos/services/proyecto.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado') || undefined;
    const buscar = searchParams.get('buscar') || undefined;

    const data = await ProyectoService.findAll({ estado, buscar });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    
    if (!body.nombre || !body.clienteNombre || !body.descripcion) {
      return NextResponse.json({ error: 'Nombre, cliente y descripción son requeridos' }, { status: 400 });
    }

    const proyecto = await ProyectoService.create(body, parseInt(session.user.id), session.user.name || 'API');
    return NextResponse.json({ ok: true, proyecto });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

