// src/modules/categorias/api/categoria.router.ts

import { NextResponse } from 'next/server';
import { CategoriaService } from '../services/categoria.service';
import { createCategoriaSchema, updateCategoriaSchema } from '../validators/categoria.validator';
import { CreateCategoriaDto } from '../dto/create-categoria.dto';
import { UpdateCategoriaDto } from '../dto/update-categoria.dto';

const service = new CategoriaService();

export async function GET() {
  const categorias = await service.getAll();
  return NextResponse.json(categorias);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createCategoriaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }
  const dto: CreateCategoriaDto = parsed.data;
  const categoria = await service.create(dto);
  return NextResponse.json(categoria, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...rest } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const parsed = updateCategoriaSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }
  const dto: UpdateCategoriaDto = parsed.data;
  const categoria = await service.update(Number(id), dto);
  return NextResponse.json(categoria);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const categoria = await service.delete(Number(id));
  return NextResponse.json(categoria);
}
