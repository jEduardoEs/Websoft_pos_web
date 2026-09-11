import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CuentasBackendService } from '@/modules/contabilidad/services/cuentas.backend.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const estado = new URL(req.url).searchParams.get('estado') || undefined;
    const resultado = await CuentasBackendService.getCuentasPagar(estado);
    return NextResponse.json(resultado);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const body = await req.json();
    const cuenta = await CuentasBackendService.crearCuentaPagar(body, session.user);
    return NextResponse.json({ ok: true, cuenta });
  } catch (e: any) {
    if (e.message === 'Datos incompletos') return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { id, montoPago, notas } = await req.json();
    const cuenta = await CuentasBackendService.pagarCuentaPagar(Number(id), montoPago, notas, session.user);
    return NextResponse.json({ ok: true, cuenta });
  } catch (e: any) {
    if (e.message === 'No encontrada') return NextResponse.json({ error: e.message }, { status: 404 });
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
