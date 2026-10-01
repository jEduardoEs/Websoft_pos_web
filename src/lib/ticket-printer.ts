// Generador de ticket térmico para Epson TM-T30II (80mm USB)
// Usa window.print() — seleccionar la impresora Epson en el diálogo

export interface TicketData {
  // Empresa
  empresaNombre: string
  empresaNit: string
  empresaDireccion?: string
  empresaTelefono?: string
  empresaLogoUrl?: string
  ticketMensaje?: string
  mostrarLogo?: boolean
  // Venta
  numero: string
  fecha: Date | string
  clienteNombre: string
  clienteNit: string
  cajero: string
 // FEL (opcional)
felUuid?: string
felSerie?: string
felNumero?: number
felCertificacion?: string
felQrUrl?: string
felCertificador?: string
isSandbox?: boolean
  // Items
  items: {
    nombre: string
    cantidad: number
    precioUnitario: number
    descuento: number
    subtotal: number
  }[]
  // Totales
  subtotal: number
  descuento: number
  impuesto: number
  total: number
  metodoPago: string
  montoRecibido: number
  cambio: number
  ivaPct?: number
}

const HR = `<div class="hr"></div>`
const HR2 = `<div class="hr2"></div>`

const fmt = (n: number) => `Q${n.toFixed(2)}`

// 80mm → ~42 chars en Courier 12px, ~38 en 11px
const trunc = (s: string, max = 22) => s.length > max ? s.slice(0, max - 1) + '…' : s

export function buildTicketHTML(d: TicketData): string {
  const fecha = new Date(d.fecha)
  const fechaStr = fecha.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const horaStr = fecha.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const ivaPct = d.ivaPct ?? 5

  // Filas de items — formato compacto
  const itemRows = d.items.map(it => {
    const nombre = trunc(it.nombre, 26)
    const cant = it.cantidad % 1 === 0 ? String(it.cantidad) : it.cantidad.toFixed(2)
    const total = it.subtotal - (it.descuento || 0)
    const descLine = it.descuento > 0
      ? `<div class="item-desc">  Descuento: -${fmt(it.descuento)}</div>`
      : ''
    return `
      <div class="item-name">${nombre}</div>
      <div class="item-line">
        <span class="item-qty">${cant} x ${fmt(it.precioUnitario)}</span>
        <span class="item-total">${fmt(total)}</span>
      </div>
      ${descLine}`
  }).join('')

// FEL / DTE certificado
const qrData = d.felQrUrl ||
  (!d.isSandbox && d.felUuid
    ? `https://fel.sat.gob.gt/verificar/${d.felUuid}`
    : '')

const felSection = d.felUuid ? `
  ${HR2}

  <div class="dte-title">DTE CERTIFICADO</div>

  ${d.isSandbox
    ? '<div class="sandbox-badge">*** DOCUMENTO DE PRUEBA ***</div>'
    : ''}

  <div class="dte-block">

    <div class="dte-label">NÚMERO DE AUTORIZACIÓN</div>
    <div class="dte-uuid">${d.felUuid}</div>

    <div class="dte-row">
      <span class="dte-key">Serie:</span>
      <span>${d.felSerie || '—'}</span>
    </div>

    <div class="dte-row">
      <span class="dte-key">Número:</span>
      <span>${d.felNumero ?? '—'}</span>
    </div>

    <div class="dte-row">
      <span class="dte-key">Fecha certificación:</span>
      <span>${
        d.felCertificacion
          ? new Date(d.felCertificacion).toLocaleString('es-GT')
          : fechaStr
      }</span>
    </div>

    ${d.felCertificador ? `
      <div class="section-title">DATOS DEL CERTIFICADOR</div>
      <div class="dte-row">
        <span class="dte-key">Certificador:</span>
        <span>${d.felCertificador}</span>
      </div>
    ` : ''}

  </div>

  ${qrData ? `
    <div class="qr-wrap">
      <img
        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}"
        class="qr"
        alt="QR DTE"
      >
      <div class="qr-text">
        ESCANEA PARA CONSULTAR<br>
        EL DOCUMENTO TRIBUTARIO
      </div>
    </div>
  ` : ''}

  <div class="sat-text">
    DOCUMENTO TRIBUTARIO ELECTRÓNICO<br>
    FEL - GUATEMALA
  </div>
` : ''

  // Logo de empresa
const logoSection =
  d.mostrarLogo !== false && d.empresaLogoUrl
    ? `
      <div class="logo-wrap">
        <img
          src="${d.empresaLogoUrl}"
          class="logo"
          alt="Logo ${d.empresaNombre}"
          onerror="this.style.display='none'"
        >
      </div>
    `
    : ''
  
 
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Ticket ${d.numero}</title>
<style>
  /* ── Reset ── */
  * { margin:0; padding:0; box-sizing:border-box; }

  /* ── Papel 80mm: área imprimible ~72mm = ~272px a 96dpi ── */
  @page {
    size: 80mm auto;
    margin: 3mm 2mm;
  }

 body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    font-weight: 600;
    color: #000;
    background: #fff;
    width: 72mm;
    margin: 0 auto;
    padding: 4px 2px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Header ── */
  .logo-wrap  { text-align:center; margin-bottom:6px; }
  .logo       { width:185px; height:165px; object-fit:contain; }
  .document-title {
  text-align: center;
  font-size: 13px;
  font-weight: 900;
  margin-top: 2px;
  letter-spacing: 0.3px;
  }

  .document-type {
  text-align: center;
  font-size: 12px;
  font-weight: 900;
  margin-top: 2px;
  margin-bottom: 5px;
  }
  .empresa    { font-size:13px; font-weight:bold; text-align:center; text-transform:uppercase; }
  .empresa-sub {
    font-size:10px;
    text-align:center;
    color:#000;
    font-weight:600;
    line-height:1.5;
  }

  /* ── Divisores ── */
  .hr  { border-top:1px dashed #000; margin:5px 0; }
  .hr2 { border-top:2px solid #000; margin:5px 0; }

  /* ── Info venta ── */
  .info-row { display:flex; justify-content:space-between; font-size:10px; margin:2px 0; }
  .info-label{ font-weight:bold; }
  .factura-num{ font-size:14px; font-weight:bold; text-align:center; margin:4px 0; }
  .fiscal-data {
  font-size: 10px;
  line-height: 1.45;
  text-align: left;
  margin: 4px 0 6px;
}

.auth-label {
  font-weight: 900;
  margin-top: 4px;
}

.auth-number {
  font-size: 9px;
  font-weight: 700;
  line-height: 1.3;
  word-break: break-all;
  margin-bottom: 4px;
}

.section-title {
  background: #000;
  color: #fff;
  font-size: 10px;
  font-weight: 900;
  text-align: center;
  text-transform: uppercase;
  padding: 3px 4px;
  margin: 6px 0 4px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

  /* ── Header tabla items ── */
  .col-header { display:flex; justify-content:space-between; font-size:9px; font-weight:bold;
                text-transform:uppercase; border-bottom:1px solid #000; padding-bottom:2px; margin-bottom:3px; }

  /* ── Items ── */
  .item-name  { font-size:10px; font-weight:bold; margin-top:3px; word-break:break-word; }
  .item-line  { display:flex; justify-content:space-between; font-size:10px; }
  .item-qty { color:#000; font-weight:600; }
  .item-total { font-weight:bold; }
  .item-desc { font-size:9px; color:#000; font-weight:600; }

  /* ── Totales ── */
  .total-row  { display:flex; justify-content:space-between; font-size:11px; margin:2px 0; }
  .total-final{ display:flex; justify-content:space-between; font-size:16px; font-weight:bold;
                border-top:2px solid #000; border-bottom:2px solid #000;
                padding:4px 0; margin:4px 0; }
  .total-cambio{ display:flex; justify-content:space-between; font-size:11px; margin:2px 0; }

  /* ── FEL ── */
 .dte-title {
    font-size:12px;
    font-weight:900;
    text-align:center;
    color:#000;
    margin:6px 0;
}

.dte-label {
    font-size:9px;
    font-weight:900;
    text-align:center;
    color:#000;
    margin:3px 0;
}

.dte-uuid {
    font-size:8px;
    font-weight:700;
    word-break:break-all;
    text-align:center;
    margin:3px 0 5px;
    line-height:1.4;
    color:#000;
}

.dte-row {
    display:flex;
    justify-content:space-between;
    gap:6px;
    font-size:9px;
    font-weight:700;
    margin:2px 0;
    color:#000;
}

.dte-key {
    font-weight:900;
}

.qr-wrap {
    text-align:center;
    margin:8px 0 5px;
}

.qr {
    display:block;
    width:110px;
    height:110px;
    margin:0 auto 4px;
}

.qr-text {
    font-size:8px;
    font-weight:900;
    color:#000;
    line-height:1.3;
}

.sat-text {
    font-size:8px;
    font-weight:700;
    text-align:center;
    color:#000;
    line-height:1.4;
    margin-top:5px;
}

  /* ── Leyendas ── */
  .legend     { font-size:9px; text-align:center; margin:3px 0; line-height:1.4; }
  .mensaje    { font-size:11px; text-align:center; font-weight:bold; margin:6px 0; }

  /* ── No imprimir elementos del navegador ── */
  @media print {
    body { padding:0; }
    @page { margin: 2mm 1mm; }
  }
</style>
</head>
<body>

 ${logoSection}

${d.felUuid ? `
  <div class="document-title">
    DOCUMENTO TRIBUTARIO ELECTRÓNICO
  </div>

  <div class="document-type">
    FACTURA
  </div>
` : `
  <div class="document-title">
    COMPROBANTE DE VENTA
  </div>
`}

<div class="section-title">DATOS DEL VENDEDOR</div>
<div class="empresa">${d.empresaNombre}</div>
<div class="empresa-sub">
  NIT: ${d.empresaNit}<br>
  ${d.empresaDireccion || ''}<br>
  ${d.empresaTelefono ? `Tel: ${d.empresaTelefono}` : ''}
</div>

  ${HR2}

${d.felUuid ? `
  <div class="fiscal-data">
    <div><strong>Serie:</strong> ${d.felSerie || '—'}</div>
    <div><strong>Número:</strong> ${d.felNumero ?? '—'}</div>

    <div class="auth-label">Número de Autorización:</div>
    <div class="auth-number">${d.felUuid}</div>

    <div><strong>Fecha de Emisión:</strong> ${fechaStr} ${horaStr}</div>
  </div>
` : `
  <div class="factura-num">${d.numero}</div>
  <div class="info-row">
    <span class="info-label">Fecha:</span>
    <span>${fechaStr}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Hora:</span>
    <span>${horaStr}</span>
  </div>
`}

${HR}
  <div class="info-row"><span class="info-label">Cajero:</span><span>${trunc(d.cajero, 18)}</span></div>
  
  <div class="section-title">DATOS DEL COMPRADOR</div>
  
  <div class="info-row"><span class="info-label">Cliente:</span><span>${trunc(d.clienteNombre, 18)}</span></div>
  <div class="info-row"><span class="info-label">NIT:</span><span>${d.clienteNit}</span></div>
  <div class="info-row"><span class="info-label">Pago:</span><span>${d.metodoPago}</span></div>


<div class="section-title">DESCRIPCIÓN DEL DOCUMENTO</div>
  <div class="col-header">
    <span>Descripción</span>
    <span>Total</span>
  </div>

  ${itemRows}

  ${HR}
  <div class="section-title">TOTALES DEL DOCUMENTO</div>
  <!-- Totales -->
  <div class="total-row"><span>Subtotal</span><span>${fmt(d.subtotal)}</span></div>
  ${d.descuento > 0 ? `<div class="total-row"><span>Descuento</span><span>-${fmt(d.descuento)}</span></div>` : ''}
  <div class="total-row"><span>IVA (${ivaPct}%)</span><span>${fmt(d.impuesto)}</span></div>
  <div class="total-final"><span>TOTAL</span><span>${fmt(d.total)}</span></div>
  <div class="total-cambio"><span>Recibido</span><span>${fmt(d.montoRecibido)}</span></div>
  <div class="total-cambio"><b>Cambio</b><b>${fmt(d.cambio)}</b></div>

  ${felSection}

  ${HR}

  <div class="legend">SUJETO A PAGOS TRIMESTRALES ISR<br>AGENTE DE RETENCIÓN DEL IVA</div>

  ${HR}

  <div class="mensaje">${d.ticketMensaje || '¡Gracias por su compra!'}</div>
  <div class="legend">websoftsolutions.com.gt<br>WhatsApp: 3671-4377</div>

  <div style="margin-bottom:30px"></div>

</body>
</html>`
}

/**
 * Imprime el ticket en ventana nueva.
 * Usar desde el cliente (browser):
 *   import { buildTicketHTML } from '@/lib/ticket-printer'
 *   const html = buildTicketHTML(data)
 *   printTicketWindow(html)
 */
export function printTicketWindow(html: string): void {
  // Ancho 302px ≈ 80mm a 96dpi, alto suficiente para scroll
  const w = window.open('', '_blank', 'width=302,height=700,left=100,top=50')
  if (!w) {
    alert('El navegador bloqueó la ventana emergente. Permite pop-ups para este sitio.')
    return
  }
  w.document.write(html)
  w.document.close()
  setTimeout(() => {
    w.focus()
    w.print()
  }, 700)
}
