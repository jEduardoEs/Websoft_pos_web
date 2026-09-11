// src/modules/proveedores/api/proveedor.router.ts

import { NextResponse } from 'next/server';
import { ProveedorService } from '../services/proveedor.service';
import { createProveedorSchema, updateProveedorSchema } from '../validators/proveedor.validator';
import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';

const service = new ProveedorService();

export async function GET() {
  const proveedores = await service.getAll();
  return NextResponse.json(proveedores);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createProveedorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }
  const dto: CreateProveedorDto = parsed.data;
  const proveedor = await service.create(dto);
  return NextResponse.json(proveedor, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...rest } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const parsed = updateProveedorSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }
  const dto: UpdateProveedorDto = parsed.data;
  const proveedor = await service.update(Number(id), dto);
  return NextResponse.json(proveedor);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const proveedor = await service.delete(Number(id));
  return NextResponse.json(proveedor);
}
