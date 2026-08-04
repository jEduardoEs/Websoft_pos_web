import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProveedorService } from '@/modules/proveedores/services/proveedor.service';

export const dynamic = 'force-dynamic';

const proveedorService = new ProveedorService();

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const { searchParams } = new URL(req.url);
    const buscar = searchParams.get('buscar') || '';
    
    const proveedores = await proveedorService.getAll(buscar);
    return NextResponse.json(proveedores);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const body = await req.json();
    const { id, nombre, nit, telefono, email, direccion, contacto, notas } = body;
    
    if (!nombre) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    
    if (id) {
      const p = await proveedorService.update(Number(id), { nombre, nit, telefono, email, direccion, contacto, notas });
      return NextResponse.json({ ok: true, proveedor: p });
    }
    
    const p = await proveedorService.create({ nombre, nit, telefono, email, direccion, contacto, notas });
    return NextResponse.json({ ok: true, proveedor: p });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    
    await proveedorService.delete(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}