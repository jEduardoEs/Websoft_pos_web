import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const keys = [
      'empresa_nombre', 'empresa_nit', 'empresa_telefono', 'empresa_web', 'empresa_direccion',
      'banco1_nombre', 'banco1_cuenta', 'banco1_titular',
      'banco2_nombre', 'banco2_cuenta', 'banco2_titular',
      'banco3_nombre', 'banco3_cuenta', 'banco3_titular',
      'banco4_nombre', 'banco4_cuenta', 'banco4_titular',
      'cuentas_nota',
    ]

    const rows = await prisma.config.findMany({ where: { clave: { in: keys } } })
    const cfg: Record<string, string> = {}
    rows.forEach((r: any) => { cfg[r.clave] = r.valor })

    const d = {
      empresa_nombre:   cfg.empresa_nombre   || 'WebSoft Solutions',
      empresa_nit:      cfg.empresa_nit      || '',
      empresa_telefono: cfg.empresa_telefono || '3836-1044 / 3671-4377',
      empresa_web:      cfg.empresa_web      || 'websoftsolutions.com.gt',
      empresa_direccion:cfg.empresa_direccion|| 'Guastatoya, El Progreso',
      cuentas_nota:     cfg.cuentas_nota     || 'Estas son las únicas cuentas bancarias autorizadas para recibir depósitos y transferencias. No procesamos órdenes si el depósito se realiza a otra cuenta.',
    }

    const bancos = [1,2,3,4].map(i => ({
      nombre:  cfg[`banco${i}_nombre`]  || '',
      cuenta:  cfg[`banco${i}_cuenta`]  || '',
      titular: cfg[`banco${i}_titular`] || '',
    })).filter(b => b.nombre && b.cuenta)

    const bancosHTML = bancos.map(b => {
      const nombreUpper = b.nombre.toUpperCase()
      const bancoConfig: Record<string, { color: string; bg: string; logo: string | null; abbr: string }> = {
        'BAC':         { color: '#cc0000', bg: '#fde8e8', logo: 'https://websoftsolutions.com.gt/bancos/bac.png',        abbr: 'BAC' },
        'CREDOMATIC':  { color: '#cc0000', bg: '#fde8e8', logo: 'https://websoftsolutions.com.gt/bancos/bac.png',        abbr: 'BAC' },
        'INDUSTRIAL':  { color: '#003087', bg: '#e6eaf4', logo: 'https://websoftsolutions.com.gt/bancos/industrial.png', abbr: 'BI'  },
        'G&T':         { color: '#003087', bg: '#eef0f8', logo: 'https://websoftsolutions.com.gt/bancos/gyt.png',        abbr: 'G&T' },
        'GYT':         { color: '#003087', bg: '#eef0f8', logo: 'https://websoftsolutions.com.gt/bancos/gyt.png',        abbr: 'G&T' },
        'CONTINENTAL': { color: '#003087', bg: '#eef0f8', logo: 'https://websoftsolutions.com.gt/bancos/gyt.png',        abbr: 'G&T' },
        'BANRURAL':    { color: '#006633', bg: '#e6f4ee', logo: 'https://websoftsolutions.com.gt/bancos/banrural.png',   abbr: 'BR'  },
        'AGROMERCANTIL':{ color: '#ff6600', bg: '#fff0e6', logo: null, abbr: 'BAM' },
        'BAM':         { color: '#ff6600', bg: '#fff0e6', logo: null, abbr: 'BAM' },
        'OCCIDENTE':   { color: '#003366', bg: '#e6edf4', logo: null, abbr: 'BO'  },
        'PROMERICA':   { color: '#e3000f', bg: '#fde8e9', logo: null, abbr: 'PRO' },
        'BANTRAB':     { color: '#003087', bg: '#e6eaf4', logo: null, abbr: 'BT'  },
        'CHN':         { color: '#006633', bg: '#e6f4ee', logo: null, abbr: 'CHN' },
      }
      const match = Object.entries(bancoConfig).find(([k]) => nombreUpper.includes(k))
      const cfg2 = match ? match[1] : { color: '#2B7FD4', bg: '#eff6ff', logo: null, abbr: b.nombre.slice(0, 2).toUpperCase() }

      const logoHTML = cfg2.logo
        ? `<img src="${cfg2.logo}" style="height:28px;max-width:80px;object-fit:contain;display:block" alt="${b.nombre}" onerror="this.style.display='none'">`
        : `<div style="background:${cfg2.color};color:#fff;font-size:11px;font-weight:900;padding:4px 8px;border-radius:6px;letter-spacing:-0.5px">${cfg2.abbr}</div>`

      return `
      <div class="banco">
        <div class="banco-header" style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:${cfg2.bg};border-bottom:1.5px solid ${cfg2.color}30">
          <div style="height:36px;display:flex;align-items:center">
            ${logoHTML}
          </div>
        </div>
        <div class="banco-datos">
          <div style="font-size:12px;font-weight:800;color:${cfg2.color};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">${b.nombre}</div>
          <div class="dato-row">
            <span class="dato-lbl">Número de cuenta</span>
            <span class="dato-val">${b.cuenta}</span>
          </div>
          <div class="dato-row">
            <span class="dato-lbl">A nombre de</span>
            <span class="dato-val">${b.titular}</span>
          </div>
        </div>
      </div>`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Cuentas Bancarias — ${d.empresa_nombre}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 12mm 14mm;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #0f172a;
    background: #fff;
    font-size: 11px;
    line-height: 1.5;
  }

  /* HEADER */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 14px;
    border-bottom: 3px solid #2B7FD4;
    margin-bottom: 18px;
  }
  .empresa-nombre {
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
  }
  .empresa-nombre span { color: #2B7FD4; }
  .empresa-sub {
    font-size: 9px;
    color: #64748b;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 2px;
  }
  .header-right {
    text-align: right;
    font-size: 9px;
    color: #64748b;
    line-height: 1.7;
  }
  .header-badge {
    background: #2B7FD4;
    color: #fff;
    font-size: 8px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    letter-spacing: 1px;
    text-transform: uppercase;
    display: inline-block;
    margin-bottom: 6px;
  }

  /* TITLE */
  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: #1e40af;
    text-align: center;
    margin-bottom: 16px;
    padding: 8px;
    background: #eff6ff;
    border-radius: 6px;
    letter-spacing: 0.5px;
  }

  /* BANCOS GRID */
  .bancos-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }

  .banco {
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    page-break-inside: avoid;
  }

  .banco-header {
    background: #f8fafc;
    border-bottom: 1.5px solid #e2e8f0;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .banco-icon {
    width: 28px;
    height: 28px;
    background: #eff6ff;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .banco-nombre {
    font-size: 12px;
    font-weight: 800;
    color: #1e40af;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .banco-datos {
    padding: 10px 12px;
  }

  .dato-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 5px;
    gap: 8px;
  }
  .dato-row:last-child { margin-bottom: 0; }

  .dato-lbl {
    font-size: 9px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .dato-val {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: 0.5px;
    text-align: right;
  }

  /* NOTA */
  .nota {
    border: 1.5px solid #fde68a;
    background: #fffbeb;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 14px;
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .nota-icon {
    flex-shrink: 0;
    margin-top: 1px;
  }
  .nota-text {
    font-size: 9.5px;
    color: #78350f;
    line-height: 1.6;
  }
  .nota-text strong {
    color: #92400e;
    font-size: 10px;
    display: block;
    margin-bottom: 3px;
  }

  /* FOOTER */
  .footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-left {
    font-size: 9px;
    color: #94a3b8;
    line-height: 1.6;
  }
  .footer-right {
    font-size: 9px;
    color: #94a3b8;
    text-align: right;
  }
  .footer-logo {
    font-size: 13px;
    font-weight: 800;
    color: #0f172a;
  }
  .footer-logo span { color: #2B7FD4; }

  /* WATERMARK LINE */
  .secure-bar {
    background: #0f172a;
    color: rgba(255,255,255,0.7);
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    text-align: center;
    padding: 5px;
    margin-bottom: 16px;
    border-radius: 4px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .banco-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .nota { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .secure-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .section-title { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div>
      <div class="empresa-nombre">Web<span>Soft</span> Solutions</div>
      <div class="empresa-sub">Tecnología y Seguridad · ${d.empresa_direccion}</div>
    </div>
    <div class="header-right">
      <div class="header-badge">Documento oficial</div><br/>
      ${d.empresa_telefono}<br/>
      ${d.empresa_web}${d.empresa_nit ? `<br/>NIT: ${d.empresa_nit}` : ''}
    </div>
  </div>

  <!-- SECURE BAR -->
  <div class="secure-bar">Cuentas bancarias autorizadas para depósitos y transferencias</div>

  <!-- TITLE -->
  <div class="section-title">Realice sus pagos únicamente a las siguientes cuentas</div>

  <!-- BANCOS -->
  <div class="bancos-grid">
    ${bancosHTML}
  </div>

  <!-- NOTA -->
  <div class="nota">
    <div class="nota-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </div>
    <div class="nota-text">
      <strong>Importante — Lea antes de realizar su pago</strong>
      ${d.cuentas_nota}
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-left">
      <div class="footer-logo">Web<span>Soft</span> Solutions</div>
      ${d.empresa_direccion} · ${d.empresa_telefono}
    </div>
    <div class="footer-right">
      Documento generado el ${new Date().toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })}<br/>
      Para verificar autenticidad contacte al ${d.empresa_telefono}
    </div>
  </div>

<script>
  // Auto-print when opened for printing
  window.onload = function() {
    document.title = 'Cuentas Bancarias — ${d.empresa_nombre}';
  }
</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
