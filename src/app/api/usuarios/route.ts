import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UsuarioService } from '@/modules/usuarios/services/usuario.service';

export const dynamic = 'force-dynamic';

const usuarioService = new UsuarioService();

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const users = await usuarioService.getAll();
    return NextResponse.json(users);
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
    const { id, nombre, usuario, password, rol, permisos, metaMensual } = body;

    if (!nombre || !usuario) {
      return NextResponse.json({ error: 'Nombre y usuario son requeridos' }, { status: 400 });
    }

    if (id) {
      await usuarioService.update(Number(id), { 
        nombre, 
        usuario, 
        password, 
        rol, 
        permisos, 
        metaMensual: parseFloat(metaMensual || '0') || 0 
      });
      return NextResponse.json({ ok: true });
    }

    if (!password) {
      return NextResponse.json({ error: 'Contraseña requerida para nuevo usuario' }, { status: 400 });
    }

    await usuarioService.create({
      nombre, 
      usuario, 
      password, 
      rol, 
      permisos, 
      metaMensual: parseFloat(metaMensual || '0') || 0
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const body = await req.json();
    const { id, accion } = body;
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    if (accion === 'activar') {
      await usuarioService.activar(Number(id));
      return NextResponse.json({ ok: true });
    }

    if (accion === 'cerrar_sesion') {
      await usuarioService.cerrarSesionActiva(Number(id));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    
    await usuarioService.delete(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}
