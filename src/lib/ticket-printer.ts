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
    <div class="dte-row"><span>Certificador:</span><span>Por definir</span></div>
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
  * { margin:0; padding:0; box-sizing:border-box; }

  @page {
    size: 80mm auto;
    margin: 2mm 1mm;
  }

  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    color: #000;
    background: #fff;
    width: 76mm;
    margin: 0 auto;
    padding: 4px 2px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Header empresa ── */
  .logo-wrap  { text-align:center; margin-bottom:4px; }
  .logo       { width:48px; height:48px; object-fit:contain; }
  .empresa    { font-size:14px; font-weight:bold; text-align:center; text-transform:uppercase; letter-spacing:0.5px; }
  .empresa-sub{ font-size:9px; text-align:center; color:#333; line-height:1.6; margin-top:2px; }

  /* ── Título DTE ── */
  .dte-header { text-align:center; font-size:11px; font-weight:bold; text-transform:uppercase; margin:4px 0 2px; }
  .dte-tipo   { text-align:center; font-size:13px; font-weight:bold; text-transform:uppercase; margin-bottom:3px; }

  /* ── Secciones con borde ── */
  .section {
    border:1px solid #000;
    margin:4px 0;
    padding:4px 5px;
  }
  .section-title {
    font-size:9px; font-weight:bold; text-align:center;
    text-transform:uppercase; border-bottom:1px solid #000;
    margin:-4px -5px 4px; padding:2px 5px;
    background:#000; color:#fff; letter-spacing:1px;
  }

  /* ── Divisores ── */
  .hr  { border:none; border-top:1px dashed #000; margin:4px 0; }
  .hr2 { border:none; border-top:2px solid #000; margin:4px 0; }

  /* ── Info rows ── */
  .info-row { display:flex; justify-content:space-between; font-size:10px; margin:1.5px 0; }
  .info-label{ font-weight:bold; }
  .factura-num{ font-size:15px; font-weight:bold; text-align:center; margin:4px 0; letter-spacing:1px; }

  /* ── Tabla items ── */
  .col-header { display:flex; justify-content:space-between; font-size:9px; font-weight:bold;
                text-transform:uppercase; border-bottom:1px solid #000; padding-bottom:2px; margin-bottom:3px; }
  .item-name  { font-size:10px; font-weight:bold; margin-top:4px; word-break:break-word; }
  .item-line  { display:flex; justify-content:space-between; font-size:10px; }
  .item-qty   { color:#333; }
  .item-total { font-weight:bold; }
  .item-desc  { font-size:9px; color:#555; }

  /* ── Totales ── */
  .total-row  { display:flex; justify-content:space-between; font-size:11px; margin:1.5px 0; }
  .total-final{ display:flex; justify-content:space-between; font-size:17px; font-weight:bold;
                border-top:2px solid #000; border-bottom:2px solid #000;
                padding:4px 0; margin:4px 0; }
  .total-cambio{ display:flex; justify-content:space-between; font-size:11px; margin:2px 0; }

  /* ── FEL ── */
  .sandbox-badge{ font-size:9px; font-weight:bold; text-align:center; margin:2px 0; letter-spacing:0.5px; }
  .dte-label  { font-size:8px; text-align:center; margin:2px 0; color:#333; font-weight:bold; }
  .dte-uuid   { font-size:7.5px; word-break:break-all; text-align:center; margin:2px 0; line-height:1.4; }
  .dte-row    { display:flex; justify-content:space-between; font-size:8.5px; margin:1px 0; }

  /* ── Leyendas ── */
  .legend     { font-size:9px; text-align:center; margin:3px 0; line-height:1.5; }
  .mensaje    { font-size:12px; text-align:center; font-weight:bold; margin:6px 0; }

  @media print {
    body { padding:0; width:76mm; }
    @page { margin: 1mm; }
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
  <div class="dte-header">Documento Tributario Electrónico</div>
  <div class="dte-tipo">Factura</div>
  ${HR2}

  <div class="factura-num">${d.numero}</div>
  ${d.felSerie && d.felNumero ? `<div style="text-align:center;font-size:10px;font-weight:bold;margin:0 0 2px">Serie: ${d.felSerie} | No. ${d.felNumero}</div>` : ''}
  <div class="info-row"><span class="info-label">Fecha Emisión:</span><span>${fechaStr}</span></div>
  <div class="info-row"><span class="info-label">Hora:</span><span>${horaStr}</span></div>
  <div class="info-row"><span class="info-label">Cajero:</span><span>${d.cajero}</span></div>

  <div class="section" style="margin-top:5px">
    <div class="section-title">Datos del Comprador</div>
    <div class="info-row"><span class="info-label">NIT:</span><span>${d.clienteNit}</span></div>
    <div class="info-row"><span class="info-label">Nombre:</span><span style="text-align:right;max-width:55%">${d.clienteNombre}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Descripción del Documento</div>
    <div class="col-header">
      <span style="width:45%">Producto</span>
      <span style="width:20%;text-align:center">P.Uni.</span>
      <span style="width:35%;text-align:right">Total</span>
    </div>
    ${itemRows}
  </div>

  <!-- Totales -->
  <div class="info-row" style="margin-top:3px"><span class="info-label">Pago:</span><span style="text-transform:capitalize">${d.metodoPago}</span></div>
  ${HR}
  <div class="total-row"><span>Sub Total</span><span>${fmt(d.subtotal)}</span></div>
  ${d.descuento > 0 ? `<div class="total-row"><span>Descuento</span><span>-${fmt(d.descuento)}</span></div>` : ''}
  <div class="total-row"><span>Total</span><span>${fmt(d.total)}</span></div>
  ${HR2}
  <div class="total-final"><span>Total</span><span>${fmt(d.total)}</span></div>
  <div class="total-cambio"><span>Valor en letras:</span></div>
  <div class="total-cambio"><span>Recibido</span><span>${fmt(d.montoRecibido)}</span></div>
  <div class="total-cambio"><span><b>Cambio</b></span><span><b>${fmt(d.cambio)}</b></span></div>

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
  const w = window.open('', '_blank', 'width=340,height=750,left=100,top=50')
  if (!w) {
    alert('El navegador bloqueó la ventana emergente. Permite pop-ups para este sitio.')
    return
  }

  // Envuelve el ticket con instrucciones de impresión arriba
  const wrapped = html.replace('<body>', `<body>
    <div id="print-instructions" style="font-family:Arial,sans-serif;background:#1581E3;color:#fff;padding:12px 16px;font-size:12px;line-height:1.6;margin-bottom:0">
      <div style="font-weight:700;font-size:13px;margin-bottom:6px">⚙ Configuración de impresión</div>
      <div>1. En el diálogo que se abrirá → <strong>Más opciones</strong></div>
      <div>2. Tamaño de papel: <strong>80 x 200mm</strong> (o "Rollo 80mm")</div>
      <div>3. Márgenes: <strong>Ninguno</strong></div>
      <div>4. Click en <strong>Imprimir</strong></div>
      <button onclick="document.getElementById('print-instructions').style.display='none';window.print()" 
        style="margin-top:10px;width:100%;padding:8px;background:#fff;color:#1581E3;border:none;border-radius:4px;font-weight:700;font-size:13px;cursor:pointer">
        Imprimir ticket →
      </button>
    </div>
    <style>@media print{#print-instructions{display:none!important}}</style>`)

  w.document.write(wrapped)
  w.document.close()
}
