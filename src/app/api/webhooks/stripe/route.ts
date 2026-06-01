import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event: any

    if (webhookSecret && signature) {
      // Verify Stripe signature manually without the stripe package
      // Simple HMAC-SHA256 verification
      const crypto = await import('crypto')
      const parts = signature.split(',')
      const ts = parts.find((p: string) => p.startsWith('t='))?.split('=')[1]
      const v1 = parts.find((p: string) => p.startsWith('v1='))?.split('=')[1]

      if (ts && v1) {
        const signed = `${ts}.${body}`
        const expected = crypto
          .createHmac('sha256', webhookSecret)
          .update(signed, 'utf8')
          .digest('hex')
        if (expected !== v1) {
          return NextResponse.json({ error: 'Signature invalid' }, { status: 400 })
        }
      }
    }

    try { event = JSON.parse(body) } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (event?.type === 'checkout.session.completed') {
      const session = event.data?.object
      if (session?.id) {
        await prisma.pedidoWeb.updateMany({
          where: { stripeSessionId: session.id },
          data: { estado: 'pagado', stripePaymentId: session.payment_intent || null },
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
