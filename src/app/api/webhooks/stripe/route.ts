import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    // Verify Stripe signature if secret is configured
    if (webhookSecret && signature) {
      // Dynamic import to avoid issues if stripe not installed
      try {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' })
        const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

        if (event.type === 'checkout.session.completed') {
          const session = event.data.object as any
          // Update pedido estado to pagado
          await prisma.pedidoWeb.updateMany({
            where: { stripeSessionId: session.id },
            data: { estado: 'pagado', stripePaymentId: session.payment_intent },
          })
        }
      } catch (err: any) {
        return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
