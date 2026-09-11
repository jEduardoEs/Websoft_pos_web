import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS })
}

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json(
        { error: 'Stripe no configurado aún. Por favor usa WhatsApp para hacer tu pedido.' },
        { status: 503, headers: CORS }
      )
    }

    const body = await req.json()
    const { items, clienteEmail, successUrl, cancelUrl } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrito vacío' }, { status: 400, headers: CORS })
    }

    // Build Stripe checkout session using raw fetch — no stripe package needed
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'gtq',
        product_data: {
          name: String(item.nombre),
          ...(item.imagenUrl ? { images: [String(item.imagenUrl)] } : {}),
        },
        unit_amount: Math.round(Number(item.precio) * 100),
      },
      quantity: Number(item.cantidad),
    }))

    // Stripe API uses form-encoded body
    const params = new URLSearchParams()
    params.append('mode', 'payment')
    params.append('success_url', successUrl || `${process.env.NEXT_PUBLIC_LANDING_URL || ''}/gracias?session_id={CHECKOUT_SESSION_ID}`)
    params.append('cancel_url', cancelUrl || `${process.env.NEXT_PUBLIC_LANDING_URL || ''}/catalogo`)
    if (clienteEmail) params.append('customer_email', clienteEmail)
    params.append('payment_method_types[]', 'card')
    params.append('metadata[source]', 'websoft_pos')

    lineItems.forEach((li: any, i: number) => {
      params.append(`line_items[${i}][price_data][currency]`, li.price_data.currency)
      params.append(`line_items[${i}][price_data][product_data][name]`, li.price_data.product_data.name)
      params.append(`line_items[${i}][price_data][unit_amount]`, String(li.price_data.unit_amount))
      params.append(`line_items[${i}][quantity]`, String(li.quantity))
    })

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const session = await stripeRes.json() as any
    if (!stripeRes.ok) {
      return NextResponse.json({ error: session?.error?.message || 'Error en Stripe' }, { status: 400, headers: CORS })
    }

    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id }, { headers: CORS })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500, headers: CORS })
  }
}
