// src/app/api/productos/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProductoService } from '@/modules/productos/services/producto.service';
import { createProductoSchema, updateProductoSchema } from '@/modules/productos/validators/producto.validator';

export const dynamic = 'force-dynamic';

const service = new ProductoService();

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const buscar = searchParams.get('buscar') || '';
    const categoria = searchParams.get('categoria') || '';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;

    const productos = await service.getAll({ buscar, categoria, limit });
    return NextResponse.json(productos);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const body = await req.json();
    const { id } = body;
    const schema = id ? updateProductoSchema : createProductoSchema;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const errorMessage = parsed.error.errors.map(e => e.message).join(', ');
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    let dto = parsed.data as any;
    if (!id) {
      if (!dto.codigo) {
        dto.codigo = `PROD-${Date.now()}`;
      }
      const producto = await service.create(dto as any);
      return NextResponse.json({ ok: true, producto });
    } else {
      const producto = await service.update(Number(id), dto);
      return NextResponse.json({ ok: true, producto });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    await service.delete(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}
