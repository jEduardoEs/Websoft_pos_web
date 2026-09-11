import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CotizacionService } from '@/modules/cotizaciones/services/cotizacion.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Correo requerido' }, { status: 400 });

    await CotizacionService.enviarCorreo(Number(params.id), email);
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Cotización no encontrada') return NextResponse.json({ error: e.message }, { status: 404 });
    if (e.message === 'RESEND_API_KEY no configurado') return NextResponse.json({ error: e.message }, { status: 500 });
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
