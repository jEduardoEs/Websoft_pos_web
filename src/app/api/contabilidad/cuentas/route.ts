import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ContabilidadService } from '@/modules/contabilidad/services/ContabilidadService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    // Keep backwards compatibility for legacy components that expect only active accounts.
    const cuentas = await ContabilidadService.getCuentas();
    return NextResponse.json(cuentas);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const body = await req.json();
    const cuenta = await ContabilidadService.createCuenta(body);
    return NextResponse.json({ ok: true, cuenta });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    const body = await req.json();
    const cuenta = await ContabilidadService.toggleCuentaStatus(id, body.activa);
    return NextResponse.json({ ok: true, cuenta });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

