// Envío de factura por correo electrónico
// Provider: Resend (recomendado) o SMTP — configurar en variables de entorno

export interface FacturaEmailData {
  // DTE data
  uuid?: string
  serie?: string
  numero?: number
  fechaCertificacion?: string
  sandbox?: boolean
  // Venta data
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
  const serieNum   = d.serie && d.numero ? `${d.serie}` : '—'
  const correlNum  = d.numero ? String(d.numero) : d.numeroInterno

  const rows = d.items.map((it, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f8faff'}">
      <td style="padding:6px 10px;border:0.5px solid #dce8f8;font-family:Courier New,monospace;font-size:10px;color:#1581E3;font-weight:700;white-space:nowrap">${it.codigo || ''}</td>
      <td style="padding:6px 10px;border:0.5px solid #dce8f8;font-size:10.5px;color:#0f172a">${it.nombre}</td>
      <td style="padding:6px 10px;border:0.5px solid #dce8f8;text-align:center;font-size:10.5px;color:#374151">${it.cantidad}</td>
      <td style="padding:6px 10px;border:0.5px solid #dce8f8;text-align:right;font-size:10.5px;color:#374151;white-space:nowrap">${fmt(it.precioUnitario)}</td>
      <td style="padding:6px 10px;border:0.5px solid #dce8f8;text-align:right;font-size:10.5px;color:#374151;white-space:nowrap">${it.descuento > 0 ? fmt(it.descuento) : '—'}</td>
      <td style="padding:6px 10px;border:0.5px solid #dce8f8;text-align:right;font-size:10.5px;font-weight:700;color:#0f172a;white-space:nowrap">${fmt(it.subtotal - it.descuento)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Factura ${d.numeroInterno} — WebSoft Solutions</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif">

<div style="max-width:680px;margin:16px auto;background:#fff;border:2px solid #1581E3;border-radius:4px;overflow:hidden;box-shadow:0 2px 8px rgba(21,129,227,0.15)">

  <!-- ENCABEZADO FORMAL -->
  <table style="width:100%;border-collapse:collapse;border-bottom:3px solid #1581E3">
    <tr>
      <td style="padding:20px 24px;vertical-align:middle;width:220px">
        <img src="https://websoft-solutions.vercel.app/logo.png"
             width="64" height="64"
             style="display:block;border-radius:8px;object-fit:contain"
             alt="WebSoft Solutions">
        <div style="margin-top:8px;font-size:15px;font-weight:700;color:#0f172a;letter-spacing:-0.3px">WebSoft Solutions</div>
        <div style="font-size:9.5px;color:#64748b;line-height:1.7;margin-top:2px">
          NIT: 115471413<br>
          Barrio el Calvario, Guastatoya<br>
          El Progreso, Guatemala<br>
          Tel: 3836-1044 &nbsp;|&nbsp; Cel: 3671-4377<br>
          websoftsolutions.com.gt
        </div>
      </td>
      <td style="padding:20px 24px;vertical-align:top;text-align:right">
        <div style="display:inline-block;border:2px solid #1581E3;border-radius:6px;padding:6px 16px;margin-bottom:10px">
          <div style="font-size:9px;font-weight:700;color:#1581E3;text-transform:uppercase;letter-spacing:1.5px">Documento Tributario Electrónico</div>
          <div style="font-size:13px;font-weight:700;color:#0f172a;margin-top:2px">FACTURA ELECTRÓNICA</div>
        </div>
        <table style="margin-left:auto;border-collapse:collapse;font-size:10.5px">
          <tr>
            <td style="padding:3px 10px 3px 0;color:#64748b;font-weight:700;text-align:right">SERIE:</td>
            <td style="padding:3px 0;font-weight:700;color:#1581E3;text-align:right;font-family:Courier New,monospace">${serieNum}</td>
          </tr>
          <tr>
            <td style="padding:3px 10px 3px 0;color:#64748b;font-weight:700;text-align:right">No.:</td>
            <td style="padding:3px 0;font-size:18px;font-weight:700;color:#0f172a;text-align:right;font-family:Courier New,monospace">${correlNum}</td>
          </tr>
          <tr>
            <td style="padding:3px 10px 3px 0;color:#64748b;font-weight:700;text-align:right">Fecha:</td>
            <td style="padding:3px 0;color:#0f172a;text-align:right">${fechaStr}</td>
          </tr>
          <tr>
            <td style="padding:3px 10px 3px 0;color:#64748b;font-weight:700;text-align:right">Hora:</td>
            <td style="padding:3px 0;color:#0f172a;text-align:right">${horaStr}</td>
          </tr>
        </table>
        ${isSandbox ? '<div style="margin-top:8px;background:#fef3c7;border:1px solid #f59e0b;border-radius:4px;padding:4px 10px;font-size:9px;font-weight:700;color:#92400e">PRUEBA — NO VÁLIDA ANTE SAT</div>' : ''}
      </td>
    </tr>
  </table>

  <!-- DATOS DEL CLIENTE -->
  <table style="width:100%;border-collapse:collapse;border-bottom:1px solid #dce8f8">
    <tr>
      <td style="padding:14px 24px;vertical-align:top;width:50%;border-right:1px solid #dce8f8">
        <div style="font-size:9px;font-weight:700;color:#1581E3;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Datos del cliente</div>
        <div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:3px">${d.clienteNombre}</div>
        <div style="font-size:10.5px;color:#475569;line-height:1.7">
          NIT: ${d.clienteNit}<br>
          ${d.clienteCorreo ? `${d.clienteCorreo}` : ''}
        </div>
      </td>
      <td style="padding:14px 24px;vertical-align:top">
        <div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Detalle de la factura</div>
        <table style="font-size:10.5px;border-collapse:collapse">
          <tr><td style="padding:2px 12px 2px 0;color:#64748b;font-weight:700">Factura interna:</td><td style="color:#1581E3;font-weight:700;font-family:Courier New,monospace">${d.numeroInterno}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#64748b;font-weight:700">Forma de pago:</td><td style="color:#0f172a">${d.metodoPago}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#64748b;font-weight:700">Moneda:</td><td style="color:#0f172a">Quetzal (GTQ)</td></tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- TABLA ITEMS -->
  <div style="padding:0 0">
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#1581E3">
          <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:700;color:#fff;border:0.5px solid #1266c0">Código</th>
          <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:700;color:#fff;border:0.5px solid #1266c0">Descripción</th>
          <th style="padding:8px 10px;text-align:center;font-size:10px;font-weight:700;color:#fff;border:0.5px solid #1266c0">Cant.</th>
          <th style="padding:8px 10px;text-align:right;font-size:10px;font-weight:700;color:#fff;border:0.5px solid #1266c0">Precio unit.</th>
          <th style="padding:8px 10px;text-align:right;font-size:10px;font-weight:700;color:#fff;border:0.5px solid #1266c0">Descuento</th>
          <th style="padding:8px 10px;text-align:right;font-size:10px;font-weight:700;color:#fff;border:0.5px solid #1266c0">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <!-- TOTALES -->
  <table style="width:100%;border-collapse:collapse;border-top:2px solid #1581E3">
    <tr>
      <td style="padding:14px 24px;vertical-align:top">
        <div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Número de autorización SAT</div>
        <div style="font-size:10px;font-weight:700;color:#1581E3;font-family:Courier New,monospace;word-break:break-all;line-height:1.5">${uuidDisplay}</div>
        <div style="font-size:9px;color:#64748b;margin-top:4px">Certificador: INFILE S.A. — NIT 12521337</div>
        ${d.fechaCertificacion ? `<div style="font-size:9px;color:#64748b">Certificado: ${new Date(d.fechaCertificacion).toLocaleString('es-GT')}</div>` : ''}
        ${d.uuid && !d.sandbox ? `<div style="margin-top:8px"><img src="https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=https://fel.sat.gob.gt/verificar/${d.uuid}" width="72" height="72" style="display:block;border:1px solid #dce8f8" alt="QR SAT"><div style="font-size:8px;color:#94a3b8;margin-top:2px">Verificar en fel.sat.gob.gt</div></div>` : ''}
      </td>
      <td style="padding:14px 24px;vertical-align:top;text-align:right;min-width:200px">
        <table style="margin-left:auto;border-collapse:collapse;font-size:11px">
          <tr><td style="padding:3px 16px 3px 0;color:#64748b;text-align:right">Subtotal:</td><td style="padding:3px 0;text-align:right;color:#0f172a;font-family:Courier New,monospace">${fmt(d.subtotal)}</td></tr>
          ${d.descuento > 0 ? `<tr><td style="padding:3px 16px 3px 0;color:#dc2626;text-align:right">Descuento:</td><td style="padding:3px 0;text-align:right;color:#dc2626;font-family:Courier New,monospace">-${fmt(d.descuento)}</td></tr>` : ''}
          <tr><td style="padding:3px 16px 3px 0;color:#64748b;text-align:right">IVA (12%):</td><td style="padding:3px 0;text-align:right;color:#0f172a;font-family:Courier New,monospace">${fmt(d.impuesto)}</td></tr>
          <tr>
            <td colspan="2" style="padding:0"><div style="border-top:2px solid #1581E3;margin:6px 0"></div></td>
          </tr>
          <tr>
            <td style="padding:3px 16px 3px 0;font-size:14px;font-weight:700;color:#0f172a;text-align:right">TOTAL GTQ:</td>
            <td style="padding:3px 0;font-size:16px;font-weight:700;color:#1581E3;text-align:right;font-family:Courier New,monospace">${fmt(d.total)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- LEYENDAS LEGALES -->
  <div style="padding:10px 24px;background:#f0f6ff;border-top:1px solid #dce8f8;border-bottom:1px solid #dce8f8">
    <div style="font-size:9px;color:#374151;font-weight:700;margin-bottom:2px">SUJETO A PAGOS TRIMESTRALES ISR · AGENTE DE RETENCIÓN DEL IVA</div>
    <div style="font-size:9px;color:#64748b;line-height:1.6">
      Documento Tributario Electrónico emitido conforme Resolución SAT-DSI-2027-2018.
      Verifique autenticidad en <span style="color:#1581E3">fel.sat.gob.gt</span> con el número de autorización indicado.
    </div>
  </div>

  <!-- FIRMAS -->
  <table style="width:100%;border-collapse:collapse;padding:0">
    <tr>
      <td style="padding:20px 24px;vertical-align:bottom;width:40%;border-right:1px solid #dce8f8;text-align:center">
        <div style="border-top:1px solid #0f172a;padding-top:4px;font-size:9px;font-weight:700;color:#374151">FIRMA Y SELLO DEL RECEPTOR</div>
        <div style="font-size:9px;color:#64748b;margin-top:2px">Nombre:</div>
        <div style="font-size:9px;color:#64748b">DPI:</div>
      </td>
      <td style="padding:20px 24px;vertical-align:bottom;text-align:right">
        <div style="font-size:9px;color:#64748b;line-height:1.7">
          WebSoft Solutions<br>
          NIT: 115471413<br>
          websoftsolutions.com.gt<br>
          Tel: 3836-1044 &nbsp;|&nbsp; Cel: 3671-4377
        </div>
      </td>
    </tr>
  </table>

</div>

</body>
</html>`
}

async function sendViaResend(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  // Leer desde DB primero, fallback a variables de entorno
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
  } catch { /* si falla, usa env vars */ }

  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY no configurado. Ve a Configuración → Ventas y Tickets para agregarlo.' }

  // Adjuntar la factura como archivo HTML (el cliente puede abrir y guardar como PDF)
  const htmlBase64 = Buffer.from(html).toString('base64')
  const attachmentName = `Factura_WebSoft_Solutions.html`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      attachments: [
        {
          filename: attachmentName,
          content: htmlBase64,
        },
      ],
    }),
  })

  const data = await res.json()
  if (!res.ok) return { ok: false, error: data.message || `HTTP ${res.status}` }
  return { ok: true }
}

// Para usar Gmail SMTP instala nodemailer: npm install nodemailer @types/nodemailer
// y cambia esta función. Por ahora usa Resend como único provider para evitar
// dependencias opcionales que rompen el build de Next.js.
async function sendViaSMTP(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  // SMTP directo requiere: npm install nodemailer @types/nodemailer
  // Si lo instalas, descomenta el código en el README y reemplaza esta función.
  console.warn('[EMAIL] SMTP configurado pero nodemailer no instalado. Usando Resend como fallback.')
  return sendViaResend(to, subject, html)
}

export async function enviarFacturaPorCorreo(
  data: FacturaEmailData,
): Promise<{ ok: boolean; error?: string }> {
  if (!data.clienteCorreo || !data.clienteCorreo.includes('@')) {
    return { ok: false, error: 'Correo del cliente no válido' }
  }

  const html = buildFacturaHTML(data)
  const subject = `Factura Electrónica ${data.numeroInterno} — WebSoft Solutions`
  const provider = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase()

  console.log(`[EMAIL] Enviando factura ${data.numeroInterno} a ${data.clienteCorreo} via ${provider}`)

  if (provider === 'smtp') {
    return sendViaSMTP(data.clienteCorreo, subject, html)
  }
  return sendViaResend(data.clienteCorreo, subject, html)
}
