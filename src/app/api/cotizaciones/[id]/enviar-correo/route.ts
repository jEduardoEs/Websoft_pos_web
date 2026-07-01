import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Correo requerido' }, { status: 400 })

  const cot = await prisma.cotizacion.findUnique({
    where: { id: Number(params.id) },
    include: { items: true },
  })
  if (!cot) return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })

  // Leer API key y from de DB
  let apiKey = process.env.RESEND_API_KEY
  let from = process.env.EMAIL_FROM || 'WebSoft Solutions <facturacion@websoftsolutions.com.gt>'
  try {
    const [keyRow, fromRow] = await Promise.all([
      prisma.config.findUnique({ where: { clave: 'resend_api_key' } }),
      prisma.config.findUnique({ where: { clave: 'email_from' } }),
    ])
    if (keyRow?.valor) apiKey = keyRow.valor
    if (fromRow?.valor) from = fromRow.valor
  } catch {}

  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY no configurado' }, { status: 500 })

  const rows = cot.items.map(it => `
    <tr>
      <td style="padding:8px 12px;font-size:11px;color:#1581E3;font-family:Courier New,monospace;border-bottom:1px solid #e3e1d8">${it.codigo || ''}</td>
      <td style="padding:8px 12px;font-size:12px;border-bottom:1px solid #e3e1d8">${it.descripcion}</td>
      <td style="padding:8px 12px;font-size:12px;text-align:center;border-bottom:1px solid #e3e1d8">${it.cantidad}</td>
      <td style="padding:8px 12px;font-size:12px;text-align:right;border-bottom:1px solid #e3e1d8">Q ${Number(it.precioUnitario).toFixed(2)}</td>
      <td style="padding:8px 12px;font-size:12px;font-weight:700;text-align:right;border-bottom:1px solid #e3e1d8">Q ${Number(it.totalItem).toFixed(2)}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f3ef;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3ef;padding:16px 0">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1.5px solid #d8d6cd;border-radius:6px;overflow:hidden">

  <tr><td style="background:#fff;padding:20px 24px;border-bottom:2px solid #18181b">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:middle">
          <div style="font-size:17px;font-weight:700;color:#18181b">WebSoft Solutions</div>
          <div style="font-size:10px;color:#8a887e;margin-top:2px">NIT: 115471413 · Guastatoya, El Progreso</div>
        </td>
        <td style="text-align:right;vertical-align:top">
          <div style="font-size:9px;font-weight:700;color:#8a887e;text-transform:uppercase;letter-spacing:1px">Cotización</div>
          <div style="font-size:20px;font-weight:700;color:#18181b;font-family:Courier New,monospace">${cot.numero}</div>
          <div style="font-size:10px;color:#52524d;margin-top:2px">${new Date(cot.createdAt).toLocaleDateString('es-GT')}</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:16px 24px;background:#f4f3ef;border-bottom:1px solid #d8d6cd">
    <div style="font-size:9px;font-weight:700;color:#8a887e;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Cliente</div>
    <div style="font-size:14px;font-weight:700;color:#18181b">${cot.clienteNombre}</div>
    <div style="font-size:11px;color:#52524d;margin-top:2px">NIT: ${cot.clienteNit || 'CF'}</div>
  </td></tr>

  <tr><td style="padding:0">
    <table width="100%" cellpadding="0" cellspacing="0">
      <thead>
        <tr style="background:#18181b">
          <th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:700;color:#fff">Código</th>
          <th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:700;color:#fff">Descripción</th>
          <th style="padding:9px 12px;text-align:center;font-size:10px;font-weight:700;color:#fff">Cant.</th>
          <th style="padding:9px 12px;text-align:right;font-size:10px;font-weight:700;color:#fff">Precio</th>
          <th style="padding:9px 12px;text-align:right;font-size:10px;font-weight:700;color:#fff">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </td></tr>

  <tr><td style="padding:16px 24px;text-align:right;border-top:2px solid #18181b">
    <table cellpadding="0" cellspacing="0" style="margin-left:auto">
      <tr><td style="padding:3px 12px 3px 0;font-size:11px;color:#8a887e;text-align:right">Subtotal:</td><td style="font-size:11px;font-family:Courier New,monospace;text-align:right;color:#18181b">Q ${cot.subtotal.toFixed(2)}</td></tr>
      ${cot.descuento > 0 ? `<tr><td style="padding:3px 12px 3px 0;font-size:11px;color:#b13a2e;text-align:right">Descuento:</td><td style="font-size:11px;font-family:Courier New,monospace;color:#b13a2e;text-align:right">-Q ${cot.descuento.toFixed(2)}</td></tr>` : ''}
      <tr><td colspan="2" style="padding:4px 0"><div style="border-top:1px solid #d8d6cd;margin:4px 0"></div></td></tr>
      <tr><td style="padding:3px 12px 3px 0;font-size:15px;font-weight:700;color:#18181b;text-align:right">TOTAL:</td><td style="font-size:18px;font-weight:700;color:#1581E3;font-family:Courier New,monospace;text-align:right">Q ${cot.total.toFixed(2)}</td></tr>
    </table>
  </td></tr>

  ${cot.notas ? `<tr><td style="padding:12px 24px;background:#f4f3ef;border-top:1px solid #d8d6cd;font-size:11px;color:#52524d">${cot.notas}</td></tr>` : ''}

  <tr><td style="padding:14px 24px;background:#18181b;text-align:center">
    <div style="font-size:11px;color:rgba(255,255,255,.7)">WebSoft Solutions · Tel: 3836-1044 | Cel: 3671-4377 · websoftsolutions.com.gt</div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to: email,
      subject: `Cotización ${cot.numero} — WebSoft Solutions`,
      html,
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data.message || `HTTP ${res.status}` }, { status: 500 })
  return NextResponse.json({ ok: true })
}
