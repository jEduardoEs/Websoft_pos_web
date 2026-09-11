import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionBackendService } from '@/modules/auth/services/session.backend.service';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ ok: false });
  
  await SessionBackendService.closeSession(parseInt(session.user.id));
  
  return NextResponse.json({ ok: true });
}
