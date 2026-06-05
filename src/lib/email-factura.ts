/**
 * WebSoft Solutions — Envío de Factura por Correo
 * Genera HTML de factura media carta (carta = 215.9 × 279.4 mm, media = mitad superior)
 * Envía vía Resend (recomendado) o SMTP genérico (Gmail, etc.)
 *
 * Variables de entorno:
 *   EMAIL_PROVIDER     → "resend" | "smtp" (default: "resend")
 *   RESEND_API_KEY     → API key de Resend (https://resend.com)
 *   SMTP_HOST          → ej: "smtp.gmail.com"
 *   SMTP_PORT          → 465 (SSL) o 587 (TLS)
 *   SMTP_USER          → tu@correo.com
 *   SMTP_PASS          → contraseña o app password de Gmail
 *   EMAIL_FROM         → "WebSoft Solutions <facturacion@websoftsolutions.com.gt>"
 */

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

// ─── HTML Factura media carta estilo ejecutivo WebSoft ─────────────────────────
export function buildFacturaHTML(d: FacturaEmailData): string {
  const fmt = (n: number) => `Q ${n.toFixed(2)}`
  const fecha = new Date(d.fecha)
  const fechaStr = fecha.toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })
  const horaStr  = fecha.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })

  const rows = d.items.map(it => `
    <tr>
      <td style="padding:7px 10px;border-bottom:1px solid #e8f0ff;font-family:monospace;font-size:10px;color:#1581E3;font-weight:700">${it.codigo || ''}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e8f0ff;font-size:11px;color:#1e293b">${it.nombre}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e8f0ff;text-align:center;font-size:11px;color:#374151">${it.cantidad}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e8f0ff;text-align:right;font-size:11px;color:#374151">${fmt(it.precioUnitario)}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e8f0ff;text-align:right;font-size:11px;color:#374151">${it.descuento > 0 ? fmt(it.descuento) : '—'}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e8f0ff;text-align:right;font-size:11px;font-weight:700;color:#0f172a">${fmt(it.subtotal - it.descuento)}</td>
    </tr>`).join('')

  const isSandbox = d.sandbox
  const uuidDisplay = d.uuid || '—'
  const serieNum = d.serie && d.numero ? `${d.serie} — ${d.numero}` : d.numeroInterno

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Factura ${d.numeroInterno} — WebSoft Solutions</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif">

<div style="max-width:700px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(21,129,227,0.12)">

  <!-- BARRA SUPERIOR AZUL -->
  <div style="background:linear-gradient(135deg,#1581E3 0%,#0f6abf 100%);padding:20px 28px;display:flex;justify-content:space-between;align-items:center">
    <div style="display:flex;align-items:center;gap:14px">
      <img src="https://websoft-solutions.vercel.app/logo.png" width="44" height="44"
           style="border-radius:8px;background:#fff;padding:4px;object-fit:contain"
           onerror="this.style.display='none'" alt="Logo WebSoft">
      <div>
        <div style="font-size:18px;font-weight:800;color:#fff;letter-spacing:-0.5px">WebSoft Solutions</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.8);letter-spacing:2px;text-transform:uppercase;margin-top:2px">Guastatoya · El Progreso · GT</div>
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;color:rgba(255,255,255,0.8);font-weight:600;text-transform:uppercase;letter-spacing:1px">Factura Electrónica</div>
      <div style="font-size:22px;font-weight:800;color:#fff;line-height:1.1">${serieNum}</div>
      ${isSandbox ? '<div style="background:#fbbf24;color:#78350f;font-size:9px;font-weight:800;padding:2px 8px;border-radius:10px;margin-top:4px;display:inline-block">PRUEBA — NO VÁLIDA</div>' : ''}
    </div>
  </div>

  <!-- DTE DATA BAR -->
  <div style="background:#0f172a;padding:10px 28px;display:flex;gap:20px;align-items:center;flex-wrap:wrap">
    <div>
      <div style="font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px">Número de Autorización</div>
      <div style="font-size:11px;color:#1581E3;font-weight:700;font-family:monospace;margin-top:2px">${uuidDisplay}</div>
    </div>
    <div style="margin-left:auto">
      <div style="font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px">Certificado</div>
      <div style="font-size:11px;color:#94a3b8;font-weight:600;margin-top:2px">${d.fechaCertificacion ? new Date(d.fechaCertificacion).toLocaleString('es-GT') : fechaStr}</div>
    </div>
    <div>
      <div style="font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px">Certificador</div>
      <div style="font-size:11px;color:#94a3b8;font-weight:600;margin-top:2px">INFILE S.A. — NIT 12521337</div>
    </div>
  </div>

  <!-- BODY -->
  <div style="padding:24px 28px">

    <!-- INFO BOXES -->
    <div style="display:flex;gap:14px;margin-bottom:20px">
      <!-- Emisor -->
      <div style="flex:1;border:1.5px solid #bfdbfe;border-radius:8px;padding:14px">
        <div style="font-size:9px;font-weight:800;color:#1581E3;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">Emisor</div>
        <div style="font-size:13px;font-weight:700;color:#0f172a">WebSoft Solutions</div>
        <div style="font-size:10px;color:#64748b;margin-top:3px;line-height:1.7">
          NIT: 115471413<br>
          Barrio el Calvario, Guastatoya<br>
          El Progreso, Guatemala<br>
          Tel: 3836-1044 / 3671-4377
        </div>
      </div>
      <!-- Receptor -->
      <div style="flex:1;border:1.5px solid #e2e8f0;border-radius:8px;padding:14px">
        <div style="font-size:9px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">Cliente</div>
        <div style="font-size:13px;font-weight:700;color:#0f172a">${d.clienteNombre}</div>
        <div style="font-size:10px;color:#64748b;margin-top:3px;line-height:1.7">
          NIT: ${d.clienteNit}<br>
          ${d.clienteCorreo}
        </div>
      </div>
      <!-- Fecha/Pago -->
      <div style="flex:1;border:1.5px solid #e2e8f0;border-radius:8px;padding:14px">
        <div style="font-size:9px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">Detalle</div>
        <div style="font-size:10px;color:#374151;line-height:2">
          <b>Fecha:</b> ${fechaStr}<br>
          <b>Hora:</b> ${horaStr}<br>
          <b>No. Interno:</b> ${d.numeroInterno}<br>
          <b>Forma de Pago:</b> ${d.metodoPago}
        </div>
      </div>
    </div>

    <!-- TABLA ITEMS -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <thead>
        <tr style="background:#1581E3">
          <th style="padding:9px 10px;text-align:left;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-radius:6px 0 0 0">Código</th>
          <th style="padding:9px 10px;text-align:left;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px">Descripción</th>
          <th style="padding:9px 10px;text-align:center;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px">Cant.</th>
          <th style="padding:9px 10px;text-align:right;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px">P/U</th>
          <th style="padding:9px 10px;text-align:right;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px">Descuento</th>
          <th style="padding:9px 10px;text-align:right;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-radius:0 6px 0 0">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <!-- TOTALS + NOTA IVA -->
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <div style="background:#0f172a;border-radius:10px;padding:16px 20px;min-width:240px">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#94a3b8;padding:3px 0">
          <span>Subtotal</span><span>Q ${d.subtotal.toFixed(2)}</span>
        </div>
        ${d.descuento > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#fbbf24;padding:3px 0"><span>Descuento</span><span>-Q ${d.descuento.toFixed(2)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#94a3b8;padding:3px 0">
          <span>IVA (12%)</span><span>Q ${d.impuesto.toFixed(2)}</span>
        </div>
        <div style="border-top:1px solid #334155;margin:8px 0"></div>
        <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:800;color:#1581E3;padding:3px 0">
          <span>TOTAL</span><span>Q ${d.total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- LEYENDAS FEL -->
    <div style="background:#f8fafc;border-left:3px solid #1581E3;border-radius:0 8px 8px 0;padding:12px 16px;font-size:10px;color:#475569;line-height:1.8;margin-bottom:16px">
      <strong style="color:#0f172a">SUJETO A PAGOS TRIMESTRALES ISR · AGENTE DE RETENCIÓN DEL IVA</strong><br>
      Documento Tributario Electrónico emitido según Resolución SAT-DSI-2027-2018.
      Verifique la autenticidad en <a href="https://fel.sat.gob.gt" style="color:#1581E3;text-decoration:none">fel.sat.gob.gt</a> con el número de autorización.
    </div>

    <!-- QR PLACEHOLDER -->
    ${d.uuid && !d.sandbox ? `
    <div style="text-align:center;margin-bottom:16px">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=https://fel.sat.gob.gt/verificar/${d.uuid}"
           alt="QR SAT" width="90" height="90" style="border:2px solid #e2e8f0;border-radius:6px;padding:4px">
      <div style="font-size:9px;color:#94a3b8;margin-top:4px">Escanea para verificar en SAT</div>
    </div>` : ''}

  </div>

  <!-- FOOTER -->
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 28px;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:10px;color:#94a3b8">
      WebSoft Solutions · websoftsolutions.com.gt<br>
      Tel: 3836-1044 · WhatsApp: 3671-4377
    </div>
    <div style="font-size:10px;color:#94a3b8;text-align:right">
      Generado automáticamente<br>
      ${new Date().toLocaleString('es-GT')}
    </div>
  </div>

</div>

</body>
</html>`
}

// ─── Enviar por Resend ─────────────────────────────────────────────────────────
async function sendViaResend(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY no configurado' }

  const from = process.env.EMAIL_FROM || 'WebSoft Solutions <facturacion@websoftsolutions.com.gt>'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  const data = await res.json()
  if (!res.ok) return { ok: false, error: data.message || `HTTP ${res.status}` }
  return { ok: true }
}

// ─── Enviar por SMTP (Nodemailer) ──────────────────────────────────────────────
async function sendViaSMTP(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  // Nodemailer está disponible como dependencia
  // Si no está instalado: npm install nodemailer @types/nodemailer
  try {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    })
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}

// ─── Función principal ─────────────────────────────────────────────────────────
export async function enviarFacturaPorCorreo(
  data: FacturaEmailData,
): Promise<{ ok: boolean; error?: string }> {
  if (!data.clienteCorreo || !data.clienteCorreo.includes('@')) {
    return { ok: false, error: 'Correo del cliente no válido' }
  }

  const html = buildFacturaHTML(data)
  const subject = `Factura ${data.numeroInterno} — WebSoft Solutions`
  const provider = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase()

  console.log(`[EMAIL] Enviando factura ${data.numeroInterno} a ${data.clienteCorreo} via ${provider}`)

  if (provider === 'smtp') {
    return sendViaSMTP(data.clienteCorreo, subject, html)
  }
  return sendViaResend(data.clienteCorreo, subject, html)
}
