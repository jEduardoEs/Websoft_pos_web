import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CajaService } from '@/modules/caja/services/caja.service';
import { cajaRequestSchema } from '@/modules/caja/validators/caja.validator';
import { CajaRequestDto } from '@/modules/caja/dto/caja.dto';

export const dynamic = 'force-dynamic';

const cajaService = new CajaService();

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const resumen = await cajaService.getResumen();
    return NextResponse.json(resumen);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = cajaRequestSchema.safeParse(body);
    
    if (!parsed.success) {
      const errorMessage = parsed.error.errors.map(e => e.message).join(', ');
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const data = parsed.data as CajaRequestDto;
    const userId = parseInt(session.user.id);
    const userName = session.user.name || 'Usuario';

    if (data.accion === 'abrir') {
      const apertura = await cajaService.abrirCaja(
        { fondoInicial: data.fondo || 0, notas: data.notas },
        userId,
        userName
      );
      return NextResponse.json({ ok: true, apertura });
    }

    if (data.accion === 'inyeccion' || data.accion === 'retiro') {
      if (!data.monto) return NextResponse.json({ error: 'Monto requerido' }, { status: 400 });
      await cajaService.registrarMovimiento(
        { tipo: data.accion, monto: data.monto, motivo: data.motivo },
        userId,
        userName
      );
      return NextResponse.json({ ok: true });
    }

    if (data.accion === 'cerrar') {
      if (data.efectivoContado === undefined) return NextResponse.json({ error: 'Efectivo contado requerido' }, { status: 400 });
      const resultado = await cajaService.cerrarCaja(
        { 
          efectivoContado: data.efectivoContado, 
          tarjetaBaucher: data.tarjetaBaucher, 
          transferenciaContada: data.transferenciaContada, 
          notas: data.notas 
        },
        userId,
        userName
      );
      return NextResponse.json({ ok: true, ...resultado });
    }

    return NextResponse.json({ error: 'Accion invalida' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'No hay caja abierta' || e.message === 'Ya hay una caja abierta' ? 400 : 500 });
  }
}
