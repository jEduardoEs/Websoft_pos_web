// src/modules/roles/api/role.router.ts
import { NextResponse } from 'next/server';
import { roleService } from '../services/roleService';
import { RolDef } from '../types/role';

export async function GET(_request: Request) {
  const roles = await roleService.getAllRoles();
  return NextResponse.json(roles);
}

export async function POST(request: Request) {
  const data: RolDef[] = await request.json();
  await roleService.saveRoles(data);
  return new NextResponse(null, { status: 204 });
}

export async function PUT(request: Request) {
  const data: RolDef[] = await request.json();
  await roleService.saveRoles(data);
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(_request: Request) {
  // Not implemented: individual deletions are handled via saveRoles logic
  return new NextResponse(null, { status: 405 });
}
