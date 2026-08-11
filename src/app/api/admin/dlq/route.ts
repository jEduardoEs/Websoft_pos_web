import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DeadLetterQueue } from '@/core/events/DeadLetterQueue';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Acceso restringido a administradores' }, { status: 403 });
    }

    const dlq = DeadLetterQueue.getInstance();
    const failedEvents = dlq.getFailedEvents();

    return NextResponse.json({
      ok: true,
      total: failedEvents.length,
      failedEvents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}
