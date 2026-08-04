import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CompraService } from '@/modules/compras/services/compra.service';
import { CreateCompraDto } from '@/modules/compras/dto/create-compra.dto';

export const dynamic = 'force-dynamic';

const compraService = new CompraService();

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const compras = await compraService.getAll();
    return NextResponse.json(compras);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const dto = body as CreateCompraDto;

    const compra = await compraService.create(dto, parseInt(session.user.id), session.user.name);

    return NextResponse.json({ ok: true, compra });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: e?.message?.includes('Agrega al menos') ? 400 : 500 });
  }
}
