// src/modules/usuarios/api/usuario.router.ts

import { NextResponse } from 'next/server';
import { UsuarioService } from '../services/usuario.service';
import { createUsuarioSchema, updateUsuarioSchema } from '../validators/usuario.validator';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';

const service = new UsuarioService();

export async function GET() {
  const usuarios = await service.getAll();
  return NextResponse.json(usuarios);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createUsuarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }
  const dto: CreateUsuarioDto = parsed.data;
  const usuario = await service.create(dto);
  return NextResponse.json(usuario, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...rest } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const parsed = updateUsuarioSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }
  const dto: UpdateUsuarioDto = parsed.data;
  const usuario = await service.update(Number(id), dto);
  return NextResponse.json(usuario);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const usuario = await service.delete(Number(id));
  return NextResponse.json(usuario);
}
