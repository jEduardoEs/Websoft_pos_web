export interface FacturaEmailData {
  uuid?: string
  serie?: string
  numero?: number
  fechaCertificacion?: string
  sandbox?: boolean
  numeroInterno: string
  fecha: Date | string
  clienteNombre: string
  clienteNit: string
  clienteCorreo: string
  items: {
    codigo?: string
    nombre: string
    cantidad: number
    precioUnitario: number
    descuento: number
    subtotal: number
  }[]
  subtotal: number
  descuento: number
  impuesto: number
  total: number
  metodoPago: string
}

export function buildFacturaHTML(d: FacturaEmailData): string {
  const fmt = (n: number) => `Q ${n.toFixed(2)}`
  const fecha = new Date(d.fecha)
  const fechaStr = fecha.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const horaStr  = fecha.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
  const isSandbox = d.sandbox
  const uuidDisplay = d.uuid || '—'
  const serieNum = d.serie || '—'
  const correlNum = d.numero ? String(d.numero) : d.numeroInterno

  const rows = d.items.map((it, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f0f6ff'}">
      <td style="padding:10px 12px;border-bottom:1px solid #dce8f8;font-size:11px;color:#1581E3;font-family:Courier New,monospace;font-weight:700;white-space:nowrap">${it.codigo || ''}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #dce8f8;font-size:12px;color:#0f172a;line-height:1.4">${it.nombre}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #dce8f8;font-size:12px;color:#374151;text-align:center;white-space:nowrap">${it.cantidad}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #dce8f8;font-size:12px;color:#374151;text-align:right;white-space:nowrap">${fmt(it.precioUnitario)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #dce8f8;font-size:12px;font-weight:700;color:#0f172a;text-align:right;white-space:nowrap">${fmt(it.subtotal - it.descuento)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Factura ${d.numeroInterno}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:16px 0">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:2px solid #1581E3;border-radius:6px;overflow:hidden">

  <!-- HEADER -->
  <tr>
    <td style="background:#ffffff;padding:24px 28px;border-bottom:3px solid #1581E3">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;width:50%">
            <img src="https://websoftsolutions.com.gt/logo.png" width="56" height="56" style="display:block;border-radius:10px" alt="Logo">
            <div style="margin-top:10px;font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-0.3px">WebSoft Solutions</div>
            <div style="font-size:10px;color:#64748b;line-height:1.8;margin-top:3px">
              NIT: 115471413<br>
              Barrio el Calvario, Guastatoya<br>
              El Progreso, Guatemala<br>
              Tel: 3836-1044 | Cel: 3671-4377<br>
              <span style="color:#1581E3">websoftsolutions.com.gt</span>
            </div>
          </td>
          <td style="vertical-align:top;text-align:right;width:50%">
            <div style="display:inline-block;border:2px solid #1581E3;border-radius:6px;padding:8px 16px;margin-bottom:12px">
              <div style="font-size:8px;font-weight:700;color:#1581E3;text-transform:uppercase;letter-spacing:1.5px">Documento Tributario Electrónico</div>
              <div style="font-size:14px;font-weight:800;color:#0f172a;margin-top:3px">FACTURA ELECTRÓNICA</div>
            </div>
            <table cellpadding="0" cellspacing="0" style="margin-left:auto">
              <tr>
                <td style="font-size:10px;color:#64748b;font-weight:700;padding:2px 10px 2px 0;text-align:right">SERIE:</td>
                <td style="font-size:10px;font-weight:700;color:#1581E3;font-family:Courier New,monospace;text-align:right">${serieNum}</td>
              </tr>
              <tr>
                <td style="font-size:10px;color:#64748b;font-weight:700;padding:2px 10px 2px 0;text-align:right">No.:</td>
                <td style="font-size:22px;font-weight:800;color:#0f172a;font-family:Courier New,monospace;text-align:right">${correlNum}</td>
              </tr>
              <tr>
                <td style="font-size:10px;color:#64748b;font-weight:700;padding:2px 10px 2px 0;text-align:right">Fecha:</td>
                <td style="font-size:10px;color:#0f172a;text-align:right">${fechaStr}</td>
              </tr>
              <tr>
                <td style="font-size:10px;color:#64748b;font-weight:700;padding:2px 10px 2px 0;text-align:right">Hora:</td>
                <td style="font-size:10px;color:#0f172a;text-align:right">${horaStr}</td>
              </tr>
            </table>
            ${isSandbox ? '<div style="margin-top:10px;background:#fef3c7;border:1px solid #f59e0b;border-radius:4px;padding:5px 12px;font-size:9px;font-weight:700;color:#92400e;display:inline-block">PRUEBA — NO VÁLIDA ANTE SAT</div>' : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- DATOS CLIENTE -->
  <tr>
    <td style="padding:0">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:16px 24px;vertical-align:top;width:50%;border-right:1px solid #dce8f8;border-bottom:1px solid #dce8f8">
            <div style="font-size:9px;font-weight:700;color:#1581E3;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Datos del cliente</div>
            <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:4px">${d.clienteNombre}</div>
            <div style="font-size:11px;color:#475569;line-height:1.7">
              NIT: ${d.clienteNit}<br>
              ${d.clienteCorreo}
            </div>
          </td>
          <td style="padding:16px 24px;vertical-align:top;border-bottom:1px solid #dce8f8">
            <div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Detalle de la factura</div>
            <table cellpadding="0" cellspacing="0" style="font-size:11px">
              <tr><td style="padding:2px 12px 2px 0;color:#64748b;font-weight:700">Factura interna:</td><td style="color:#1581E3;font-weight:700;font-family:Courier New,monospace">${d.numeroInterno}</td></tr>
              <tr><td style="padding:2px 12px 2px 0;color:#64748b;font-weight:700">Forma de pago:</td><td style="color:#0f172a;text-transform:capitalize">${d.metodoPago}</td></tr>
              <tr><td style="padding:2px 12px 2px 0;color:#64748b;font-weight:700">Moneda:</td><td style="color:#0f172a">Quetzal (GTQ)</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ITEMS -->
  <tr>
    <td style="padding:0">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <thead>
          <tr style="background:#1581E3">
            <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#fff;border-right:1px solid #1266c0">Código</th>
            <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#fff;border-right:1px solid #1266c0">Descripción</th>
            <th style="padding:10px 12px;text-align:center;font-size:10px;font-weight:700;color:#fff;border-right:1px solid #1266c0">Cant.</th>
            <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:700;color:#fff;border-right:1px solid #1266c0">P. Unit.</th>
            <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:700;color:#fff">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </td>
  </tr>

  <!-- TOTALES -->
  <tr>
    <td style="padding:0;border-top:2px solid #1581E3">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:16px 24px;vertical-align:top;width:55%;border-right:1px solid #dce8f8">
            <div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Número de autorización SAT</div>
            <div style="font-size:10px;font-weight:700;color:#1581E3;font-family:Courier New,monospace;word-break:break-all;line-height:1.6">${uuidDisplay}</div>
            <div style="font-size:9px;color:#64748b;margin-top:6px;line-height:1.6">
              Certificador: Por definir<br>
              ${d.fechaCertificacion ? `Certificado: ${new Date(d.fechaCertificacion).toLocaleString('es-GT')}` : ''}
            </div>
            ${d.uuid && !d.sandbox ? `<div style="margin-top:10px"><img src="https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=https://fel.sat.gob.gt/verificar/${d.uuid}" width="72" height="72" style="border:1px solid #dce8f8;display:block" alt="QR SAT"><div style="font-size:8px;color:#94a3b8;margin-top:3px">Verificar en fel.sat.gob.gt</div></div>` : ''}
          </td>
          <td style="padding:16px 24px;vertical-align:top;text-align:right">
            <table cellpadding="0" cellspacing="0" style="margin-left:auto;font-size:12px">
              <tr><td style="padding:4px 16px 4px 0;color:#64748b;text-align:right">Subtotal:</td><td style="padding:4px 0;color:#0f172a;text-align:right;font-family:Courier New,monospace">${fmt(d.subtotal)}</td></tr>
              ${d.descuento > 0 ? `<tr><td style="padding:4px 16px 4px 0;color:#dc2626;text-align:right">Descuento:</td><td style="padding:4px 0;color:#dc2626;text-align:right;font-family:Courier New,monospace">-${fmt(d.descuento)}</td></tr>` : ''}
              <tr><td style="padding:4px 16px 4px 0;color:#64748b;text-align:right">IVA (12%):</td><td style="padding:4px 0;color:#0f172a;text-align:right;font-family:Courier New,monospace">${fmt(d.impuesto)}</td></tr>
              <tr><td colspan="2" style="padding:0"><div style="border-top:2px solid #1581E3;margin:8px 0"></div></td></tr>
              <tr>
                <td style="padding:4px 16px 4px 0;font-size:15px;font-weight:700;color:#0f172a;text-align:right">TOTAL GTQ:</td>
                <td style="padding:4px 0;font-size:18px;font-weight:700;color:#1581E3;text-align:right;font-family:Courier New,monospace">${fmt(d.total)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- LEYENDA LEGAL -->
  <tr>
    <td style="padding:12px 24px;background:#f0f6ff;border-top:1px solid #dce8f8;border-bottom:1px solid #dce8f8">
      <div style="font-size:9px;font-weight:700;color:#374151;margin-bottom:3px">SUJETO A PAGOS TRIMESTRALES ISR · AGENTE DE RETENCIÓN DEL IVA</div>
      <div style="font-size:9px;color:#64748b;line-height:1.6">Documento Tributario Electrónico emitido conforme Resolución SAT-DSI-2027-2018. Verifique autenticidad en <span style="color:#1581E3">fel.sat.gob.gt</span></div>
    </td>
  </tr>

  <!-- FIRMA -->
  <tr>
    <td style="padding:0">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:20px 24px;text-align:center;border-right:1px solid #dce8f8;width:45%">
            <div style="border-top:1px solid #0f172a;padding-top:6px;font-size:9px;font-weight:700;color:#374151">FIRMA Y SELLO DEL RECEPTOR</div>
            <div style="font-size:9px;color:#64748b;margin-top:4px;line-height:1.7">Nombre:<br>DPI:</div>
          </td>
          <td style="padding:20px 24px;text-align:right">
            <div style="font-size:10px;color:#64748b;line-height:1.8">
              <strong style="color:#0f172a">WebSoft Solutions</strong><br>
              NIT: 115471413<br>
              Tel: 3836-1044 | Cel: 3671-4377<br>
              websoftsolutions.com.gt
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 24px;text-align:center">
      <div style="font-size:11px;color:#64748b">¡Gracias por su compra! · <strong style="color:#0f172a">WebSoft Solutions</strong> · Guastatoya, El Progreso</div>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>`
}

async function sendViaResend(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  let apiKey = process.env.RESEND_API_KEY
  let from = process.env.EMAIL_FROM || 'WebSoft Solutions <facturacion@websoftsolutions.com.gt>'

  try {
    const { prisma } = await import('@/lib/prisma')
    const [keyRow, fromRow] = await Promise.all([
      prisma.config.findUnique({ where: { clave: 'resend_api_key' } }),
      prisma.config.findUnique({ where: { clave: 'email_from' } }),
    ])
    if (keyRow?.valor) apiKey = keyRow.valor
    if (fromRow?.valor) from = fromRow.valor
  } catch { /* usa env vars */ }

  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY no configurado' }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  })

  const data = await res.json()
  if (!res.ok) return { ok: false, error: data.message || `HTTP ${res.status}` }
  return { ok: true }
}

export async function enviarFacturaPorCorreo(data: FacturaEmailData): Promise<{ ok: boolean; error?: string }> {
  if (!data.clienteCorreo || !data.clienteCorreo.includes('@')) {
    return { ok: false, error: 'Correo del cliente no válido' }
  }
  const html = buildFacturaHTML(data)
  const subject = `Factura Electrónica ${data.numeroInterno} — WebSoft Solutions`
  return sendViaResend(data.clienteCorreo, subject, html)
}
