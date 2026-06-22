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

const HR  = `<div class="hr"></div>`
const HR2 = `<div class="hr2"></div>`

const fmt = (n: number) => `Q${n.toFixed(2)}`

// 80mm → ~42 chars en Courier 12px, ~38 en 11px
const trunc = (s: string, max = 22) => s.length > max ? s.slice(0, max - 1) + '…' : s

export function buildTicketHTML(d: TicketData): string {
  const fecha = new Date(d.fecha)
  const fechaStr = fecha.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const horaStr  = fecha.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const ivaPct = d.ivaPct ?? 12

  // Filas de items — formato compacto
  const itemRows = d.items.map(it => {
    const nombre = trunc(it.nombre, 26)
    const cant   = it.cantidad % 1 === 0 ? String(it.cantidad) : it.cantidad.toFixed(2)
    const total  = it.subtotal - (it.descuento || 0)
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

  // FEL section
  const felSection = d.felUuid ? `
    ${HR}
    <div class="dte-title">Documento tributario electrónico</div>
    ${d.isSandbox ? '<div class="sandbox-badge">*** PRUEBA — NO VÁLIDA ***</div>' : ''}
    <div class="dte-label">No. Autorización:</div>
    <div class="dte-uuid">${d.felUuid}</div>
    <div class="dte-row">
      <span>Serie/No.:</span>
      <span>${d.felSerie || ''}${d.felNumero ? ` / ${d.felNumero}` : ''}</span>
    </div>
    <div class="dte-row">
      <span>Certificado:</span>
      <span>${d.felCertificacion ? new Date(d.felCertificacion).toLocaleString('es-GT') : fechaStr}</span>
    </div>
    <div class="dte-row"><span>Certificador:</span><span>INFILE S.A.</span></div>
    <div class="dte-label">Verificar en: fel.sat.gob.gt</div>
    ${d.felUuid && !d.isSandbox ? `
    <div style="text-align:center;margin:6px 0">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://fel.sat.gob.gt/verificar/${d.felUuid}"
           width="80" height="80" style="display:block;margin:0 auto" alt="QR">
    </div>` : ''}` : ''

  // Logo
  const logoSection = (d.mostrarLogo !== false && d.empresaLogoUrl) ? `
    <div class="logo-wrap">
      <img src="${d.empresaLogoUrl}" class="logo" alt="Logo" onerror="this.style.display='none'">
    </div>` : ''

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
  .logo       { width:52px; height:52px; object-fit:contain; }
  .empresa    { font-size:13px; font-weight:bold; text-align:center; text-transform:uppercase; }
  .empresa-sub{ font-size:9px; text-align:center; color:#444; line-height:1.5; }

  /* ── Divisores ── */
  .hr  { border-top:1px dashed #000; margin:5px 0; }
  .hr2 { border-top:2px solid #000; margin:5px 0; }

  /* ── Info venta ── */
  .info-row { display:flex; justify-content:space-between; font-size:10px; margin:2px 0; }
  .info-label{ font-weight:bold; }
  .factura-num{ font-size:14px; font-weight:bold; text-align:center; margin:4px 0; }

  /* ── Header tabla items ── */
  .col-header { display:flex; justify-content:space-between; font-size:9px; font-weight:bold;
                text-transform:uppercase; border-bottom:1px solid #000; padding-bottom:2px; margin-bottom:3px; }

  /* ── Items ── */
  .item-name  { font-size:10px; font-weight:bold; margin-top:3px; word-break:break-word; }
  .item-line  { display:flex; justify-content:space-between; font-size:10px; }
  .item-qty   { color:#333; }
  .item-total { font-weight:bold; }
  .item-desc  { font-size:9px; color:#555; }

  /* ── Totales ── */
  .total-row  { display:flex; justify-content:space-between; font-size:11px; margin:2px 0; }
  .total-final{ display:flex; justify-content:space-between; font-size:16px; font-weight:bold;
                border-top:2px solid #000; border-bottom:2px solid #000;
                padding:4px 0; margin:4px 0; }
  .total-cambio{ display:flex; justify-content:space-between; font-size:11px; margin:2px 0; }

  /* ── FEL ── */
  .dte-title  { font-size:8px; font-weight:normal; text-align:center; color:#666;
                margin:3px 0; letter-spacing:0px; }
  .sandbox-badge{ font-size:9px; font-weight:bold; text-align:center; margin:2px 0; }
  .dte-label  { font-size:8px; text-align:center; margin:2px 0; color:#666; }
  .dte-uuid   { font-size:7.5px; font-weight:normal; word-break:break-all; text-align:center;
                margin:2px 0; line-height:1.4; color:#777; }
  .dte-row    { display:flex; justify-content:space-between; font-size:8px; margin:1px 0; color:#666; }

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
  <div class="empresa">${d.empresaNombre}</div>
  <div class="empresa-sub">
    NIT: ${d.empresaNit}<br>
    ${d.empresaDireccion || ''}<br>
    ${d.empresaTelefono ? `Tel: ${d.empresaTelefono}` : ''}
  </div>

  ${HR2}

  <div class="factura-num">${d.numero}</div>
  ${d.felSerie && d.felNumero ? `<div style="text-align:center;font-size:10px;font-weight:bold;margin:0 0 3px">Serie ${d.felSerie} | No. ${d.felNumero}</div>` : ''}
  ${HR}
  <div class="info-row"><span class="info-label">Fecha:</span><span>${fechaStr}</span></div>
  <div class="info-row"><span class="info-label">Hora:</span><span>${horaStr}</span></div>
  <div class="info-row"><span class="info-label">Cajero:</span><span>${trunc(d.cajero, 18)}</span></div>
  ${HR}
  <div class="info-row"><span class="info-label">Cliente:</span><span>${trunc(d.clienteNombre, 18)}</span></div>
  <div class="info-row"><span class="info-label">NIT:</span><span>${d.clienteNit}</span></div>
  <div class="info-row"><span class="info-label">Pago:</span><span>${d.metodoPago}</span></div>

  ${HR}

  <div class="col-header">
    <span>Descripción</span>
    <span>Total</span>
  </div>

  ${itemRows}

  ${HR}

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
  // Inyectar aviso de impresión antes del body
  const htmlConAviso = html.replace(
    '</body>',
    `<div id="print-tip" style="position:fixed;bottom:0;left:0;right:0;background:#1581E3;color:#fff;font-family:sans-serif;font-size:11px;padding:8px;text-align:center;z-index:9999">
      Al guardar PDF: en "Más opciones" elige <b>Tamaño: 80x200mm</b> (o el largo del ticket) y <b>Márgenes: Ninguno</b>
      <button onclick="document.getElementById('print-tip').style.display='none'" style="margin-left:10px;background:rgba(255,255,255,.3);border:none;color:#fff;cursor:pointer;padding:2px 8px;border-radius:3px">OK</button>
    </div></body>`
  )
  w.document.write(htmlConAviso)
  w.document.close()
  setTimeout(() => {
    w.focus()
    w.print()
  }, 700)
}
