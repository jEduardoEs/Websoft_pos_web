import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe no configurado. Agrega STRIPE_SECRET_KEY en Vercel.' }, { status: 500 })
    }

    const body = await req.json()
    const { items, clienteEmail, successUrl, cancelUrl } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 })
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

    // Build line items for Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'gtq', // Guatemalan Quetzal
        product_data: {
          name: item.nombre,
          ...(item.imagenUrl ? { images: [item.imagenUrl] } : {}),
        },
        unit_amount: Math.round(item.precio * 100), // Stripe uses cents
      },
      quantity: item.cantidad,
    }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: clienteEmail,
      success_url: successUrl || `${process.env.NEXT_PUBLIC_LANDING_URL}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_LANDING_URL}/catalogo`,
      metadata: { source: 'websoft_pos' },
    })

    return NextResponse.json(
      { ok: true, url: session.url, sessionId: session.id },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error al crear sesión de pago' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
