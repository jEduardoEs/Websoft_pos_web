import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { VentaService } from '@/modules/ventas/services/venta.service';
import { CreateVentaDto } from '@/modules/ventas/dto/create-venta.dto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fechaIni = searchParams.get('fecha_ini');
  const fechaFin = searchParams.get('fecha_fin');
  const estado = searchParams.get('estado');
  const buscar = searchParams.get('buscar');

  try {
    const ventas = await VentaService.findAll({ fechaIni, fechaFin, estado, buscar });
    return NextResponse.json(ventas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body: CreateVentaDto = await req.json();
    const result = await VentaService.create(body, session.user.id, session.user.name || 'Usuario');
    
    return NextResponse.json({
      ok: true,
      venta: result.venta,
      fel: result.fel,
      email: result.email,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

  try {
    await VentaService.anular(parseInt(id));
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
