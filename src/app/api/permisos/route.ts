// src/app/api/permisos/route.ts
import { GET as getPermission, POST as postPermission, PUT as putPermission, DELETE as deletePermission } from '@/modules/permisos/api/permission.router';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return getPermission(request);
}
export async function POST(request: Request) {
  return postPermission(request);
}
export async function PUT(request: Request) {
  return putPermission(request);
}
export async function DELETE(request: Request) {
  return deletePermission(request);
}
