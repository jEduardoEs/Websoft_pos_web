import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ContabilidadService } from '@/modules/contabilidad/services/ContabilidadService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const fi = searchParams.get('fi') || undefined;
    const ff = searchParams.get('ff') || undefined;
    const tipo = searchParams.get('tipo') || undefined;

    const res = await ContabilidadService.getAsientos(fi, ff, tipo);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const body = await req.json();
    body.usuarioNombre = session.user?.name || 'Usuario';
    const res = await ContabilidadService.createAsiento(body);
    return NextResponse.json({ ok: true, asiento: res });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = session?.user?.role === 'admin';
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    
    await ContabilidadService.deleteAsiento(id, isAdmin);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    
    const res = await ContabilidadService.updateAsiento(Number(id), data);
    return NextResponse.json({ ok: true, asiento: res });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
