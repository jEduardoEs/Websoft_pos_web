import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ClienteBackendService } from '@/modules/clientes/services/cliente.backend.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const nit = searchParams.get('nit') || '';
    const nombre = searchParams.get('nombre') || '';

    const resultado = await ClienteBackendService.getHistorial(nit, nombre);
    return NextResponse.json(resultado);
  } catch (e: any) {
    console.error('clientes/historial/route.ts error:', e.message);
    if (e.message === 'NIT o nombre requerido') return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}