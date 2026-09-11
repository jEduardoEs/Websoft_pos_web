// src/modules/clientes/api/cliente.router.ts

import { NextResponse } from 'next/server';
import { ClienteService } from '../services/cliente.service';
import { createClienteSchema, updateClienteSchema } from '../validators/cliente.validator';
import { CreateClienteDto } from '../dto/create-cliente.dto';
import { UpdateClienteDto } from '../dto/update-cliente.dto';

const service = new ClienteService();

export async function GET() {
  const clientes = await service.getAll();
  return NextResponse.json(clientes);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createClienteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }
  const dto: CreateClienteDto = parsed.data;
  const cliente = await service.create(dto);
  return NextResponse.json(cliente, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...rest } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const parsed = updateClienteSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }
  const dto: UpdateClienteDto = parsed.data;
  const cliente = await service.update(Number(id), dto);
  return NextResponse.json(cliente);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const cliente = await service.delete(Number(id));
  return NextResponse.json(cliente);
}
