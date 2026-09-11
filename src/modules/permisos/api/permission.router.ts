// src/modules/permisos/api/permission.router.ts
import { NextResponse } from 'next/server';
import { PermissionService } from '../services/permission.service';
import { permissionSchema } from '../validators/permission.validator';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';

const service = new PermissionService();

export async function GET(request: Request) {
  const permissions = await service.findAll();
  return NextResponse.json(permissions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = permissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }
  const dto: CreatePermissionDto = parsed.data;
  const permission = await service.create(dto);
  return NextResponse.json(permission, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...rest } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const updated = await service.update(id, rest as UpdatePermissionDto);
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const deleted = await service.delete(id);
  return NextResponse.json(deleted);
}
