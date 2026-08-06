import { NextRequest, NextResponse } from 'next/server';
import { TiendaBackendService } from '@/modules/tienda/services/tienda.backend.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    await TiendaBackendService.handleStripeWebhook(body, signature, webhookSecret);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Signature invalid' || e.message === 'Invalid JSON') {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}
