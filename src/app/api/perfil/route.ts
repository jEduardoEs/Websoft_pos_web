import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PerfilService } from '@/modules/perfil/services/perfil.service';

export const dynamic = 'force-dynamic';

const perfilService = new PerfilService();

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const perfil = await perfilService.getPerfil(parseInt(session.user.id));
    if (!perfil) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    return NextResponse.json(perfil);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const { nombre, password } = body;

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const updated = await perfilService.updatePerfil(parseInt(session.user.id), { nombre, password });
    
    return NextResponse.json({ ok: true, perfil: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}
