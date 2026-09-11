import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ClienteBackendService } from '@/modules/clientes/services/cliente.backend.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const { searchParams } = new URL(req.url);
    const nit = searchParams.get('nit');
    
    if (!nit) return NextResponse.json({ encontrado: false });
    
    const cliente = await ClienteBackendService.buscarPorNit(nit);
    if (cliente) return NextResponse.json({ encontrado: true, cliente });
    
    return NextResponse.json({ encontrado: false });
  } catch (e: any) {
    console.error('clientes/buscar-nit/route.ts error:', e.message);
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}