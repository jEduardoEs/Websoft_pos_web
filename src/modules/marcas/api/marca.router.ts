// src/modules/marcas/api/marca.router.ts

import { NextResponse } from 'next/server';
import { MarcaService } from '../services/marca.service';
import { createMarcaSchema, updateMarcaSchema } from '../validators/marca.validator';
import { CreateMarcaDto } from '../dto/create-marca.dto';
import { UpdateMarcaDto } from '../dto/update-marca.dto';

const service = new MarcaService();

export async function GET() {
  const marcas = await service.getAll();
  return NextResponse.json(marcas);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createMarcaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }
  const dto: CreateMarcaDto = parsed.data;
  const marca = await service.create(dto);
  return NextResponse.json(marca, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...rest } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const parsed = updateMarcaSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }
  const dto: UpdateMarcaDto = parsed.data;
  const marca = await service.update(Number(id), dto);
  return NextResponse.json(marca);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const marca = await service.delete(Number(id));
  return NextResponse.json(marca);
}
