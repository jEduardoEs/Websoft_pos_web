import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProyectoService } from '@/modules/proyectos/services/proyecto.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const result = await ProyectoService.facturarProyecto(
      Number(params.id),
      body,
      parseInt(session.user.id),
      session.user.name || 'API'
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error('[FacturarProyecto API Error]:', e);
    return NextResponse.json({ error: e.message || 'Error al facturar el proyecto' }, { status: 500 });
  }
}
