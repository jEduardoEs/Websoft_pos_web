import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CotizacionService } from '@/modules/cotizaciones/services/cotizacion.service';
import { createCotizacionDto } from '@/modules/cotizaciones/dto/create-cotizacion.dto';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const cotizaciones = await CotizacionService.findAll();
    return NextResponse.json(cotizaciones);
  } catch (e: any) {
    console.error('GET cotizaciones error:', e);
    if (e?.code === 'P2021' || e?.message?.includes('does not exist')) {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: 'Error al obtener cotizaciones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    
    // Validate with DTO
    const validation = createCotizacionDto.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const usuarioId = parseInt(session.user.id);
    const usuarioNombre = session.user.name || 'Desconocido';

    const cotizacion = await CotizacionService.create(validation.data, usuarioId, usuarioNombre);
    return NextResponse.json({ ok: true, cotizacion });
  } catch (e: any) {
    console.error('POST cotizacion error:', e);
    if (e?.code === 'P2021' || e?.message?.includes('does not exist')) {
      return NextResponse.json({
        error: 'La tabla de cotizaciones no existe. Ejecuta: npx prisma db push',
      }, { status: 500 });
    }
    return NextResponse.json({
      error: e?.message || 'Error interno del servidor',
    }, { status: 500 });
  }
}
