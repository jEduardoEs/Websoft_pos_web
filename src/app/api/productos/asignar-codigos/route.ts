import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProductoService } from '@/modules/productos/services/producto.service';

export const dynamic = 'force-dynamic';

const service = new ProductoService();

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { soloSinCodigo } = await req.json();
    
    const resultado = await service.asignarCodigos(soloSinCodigo);
    return NextResponse.json(resultado);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
