import { NextResponse } from 'next/server';
import { roleService } from '@/modules/roles/services/roleService';
import { RolDef } from '@/modules/roles/types/role';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const roles = await roleService.getAllRoles();
    return NextResponse.json(roles);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data: RolDef[] = await request.json();
    await roleService.saveRoles(data);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
