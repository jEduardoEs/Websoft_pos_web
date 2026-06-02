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
    rows.forEach(r => { cfg[r.clave] = r.valor })

    const d = {
      empresa_nombre:   cfg.empresa_nombre   || 'WebSoft Solutions',
      empresa_nit:      cfg.empresa_nit      || '',
      empresa_telefono: cfg.empresa_telefono || '3836-1044 / 3671-4377',
      empresa_web:      cfg.empresa_web      || 'websoft-solutions.vercel.app',
      empresa_direccion:cfg.empresa_direccion|| 'Guastatoya, El Progreso',
      cuentas_nota:     cfg.cuentas_nota     || 'Estas son las únicas cuentas bancarias autorizadas para recibir depósitos y transferencias. No procesamos órdenes si el depósito se realiza a otra cuenta.',
    }

    const bancos = [1,2,3,4].map(i => ({
      nombre:  cfg[`banco${i}_nombre`]  || '',
      cuenta:  cfg[`banco${i}_cuenta`]  || '',
      titular: cfg[`banco${i}_titular`] || '',
    })).filter(b => b.nombre && b.cuenta)

    const bancosHTML = bancos.map(b => `
      <div class="banco">
        <div class="banco-header">
          <div class="banco-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2B7FD4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="banco-nombre">${b.nombre}</div>
        </div>
        <div class="banco-datos">
          <div class="dato-row">
            <span class="dato-lbl">Número de cuenta</span>
            <span class="dato-val">${b.cuenta}</span>
          </div>
          <div class="dato-row">
            <span class="dato-lbl">A nombre de</span>
            <span class="dato-val">${b.titular}</span>
          </div>
        </div>
      </div>`).join('')

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Cuentas Bancarias — ${d.empresa_nombre}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@page{margin:0;size:A4}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Segoe UI',Arial,sans-serif;color:#0f172a;background:#fff;font-size:11px;line-height:1.5}
.page{min-height:297mm;display:flex;flex-direction:column}
.accent{height:5px;background:linear-gradient(90deg,#1e3a5f 0%,#2B7FD4 50%,#1e3a5f 100%);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.header{padding:20px 28px 16px;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #e2e8f0}
.brand{display:flex;align-items:center;gap:10px}
.brand-box{width:36px;height:36px;background:#1e3a5f;border-radius:8px;display:flex;align-items:center;justify-content:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.brand-box span{color:#fff;font-size:14px;font-weight:700}
.brand-name{font-size:18px;font-weight:700;color:#0f172a}
.brand-name em{color:#2B7FD4;font-style:normal}
.brand-sub{font-size:9px;color:#64748b;margin-top:2px;letter-spacing:1px;text-transform:uppercase}
.doc-right{text-align:right}
.doc-badge{font-size:9px;font-weight:600;color:#fff;background:#1e3a5f;padding:3px 12px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;display:inline-block;margin-bottom:6px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.doc-num{font-size:16px;font-weight:700;color:#2B7FD4}
.doc-date{font-size:10px;color:#64748b;margin-top:3px}
.body{padding:20px 28px;flex:1}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}
.info-box{background:#f8fafc;border-radius:8px;padding:12px 14px;border-left:3px solid #2B7FD4;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.info-box-title{font-size:9px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
.info-box p{font-size:11px;color:#0f172a;line-height:1.65}
.info-box strong{font-weight:600}
.sec-title{font-size:9px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #e2e8f0}
table{width:100%;border-collapse:collapse;margin-bottom:14px}
thead tr{background:#1e3a5f;-webkit-print-color-adjust:exact;print-color-adjust:exact}
thead th{padding:8px 11px;font-size:9px;font-weight:600;color:#fff;text-align:left;text-transform:uppercase;letter-spacing:0.8px}
th.r,td.r{text-align:right}
th.c,td.c{text-align:center}
tbody tr:nth-child(even){background:#f8fafc;-webkit-print-color-adjust:exact;print-color-adjust:exact}
tbody td{padding:8px 11px;font-size:11px;color:#334155;border-bottom:1px solid #f1f5f9}
td.b{font-weight:600;color:#0f172a}
.totals{display:flex;justify-content:flex-end;margin-bottom:18px}
.totals-box{width:260px;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0}
.t-row{display:flex;justify-content:space-between;padding:7px 14px;border-bottom:1px solid #e2e8f0;font-size:11px}
.t-grand{background:#1e3a5f;padding:11px 14px;display:flex;justify-content:space-between;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.t-grand span{color:#fff;font-weight:700;font-size:13px}
.highlight{background:#eff6ff;border-left:3px solid #2B7FD4;border-radius:0 6px 6px 0;padding:9px 13px;margin-bottom:10px;font-size:10px;font-weight:600;color:#1e40af;line-height:1.7;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.highlight strong{font-size:11.5px;display:block;margin-bottom:3px}
.conds{font-size:10px;color:#475569;line-height:1.75}
.conds strong{color:#0f172a}
.signs{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0}
.sign-line{border-top:1.5px solid #0f172a;padding-top:6px;font-size:10px;color:#475569}
.sign-line strong{display:block;font-size:11px;color:#0f172a;margin-bottom:40px}
.footer{padding:12px 28px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;background:#f8fafc;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.footer-txt{font-size:9px;color:#94a3b8;line-height:1.6}
.footer-brand{font-size:11px;font-weight:700;color:#0f172a}
.footer-brand em{color:#2B7FD4;font-style:normal}
.bank-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}
.bank-card{background:#f8fafc;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0}
.bank-header{background:#1e3a5f;padding:11px 16px;display:flex;align-items:center;gap:10px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.bank-icon{width:28px;height:28px;background:rgba(255,255,255,.15);border-radius:6px;display:flex;align-items:center;justify-content:center}
.bank-name{color:#fff;font-size:12px;font-weight:600;letter-spacing:.3px}
.bank-body{padding:13px 16px}
.bank-row{display:flex;flex-direction:column;margin-bottom:8px}
.bank-label{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px}
.bank-value{font-size:14px;font-weight:700;color:#0f172a;letter-spacing:.5px}
.warning-box{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:13px 16px;margin-bottom:16px;display:flex;gap:12px;align-items:flex-start;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.warning-icon{flex-shrink:0;margin-top:1px;color:#d97706}
.warning-text{font-size:10px;color:#78350f;line-height:1.7}
.warning-text strong{color:#92400e;font-size:11px;display:block;margin-bottom:3px}
</style>
</head>
<body>
<div class="page">
  <div class="accent"></div>
  <div class="header">
    <div class="brand">
      <div class="brand-box"><span>W</span></div>
      <div>
        <div class="brand-name">Web<em>Soft</em> Solutions</div>
        <div class="brand-sub">Tecnologia y Seguridad · ${d.empresa_direccion}</div>
      </div>
    </div>
    <div class="doc-right">
      <div class="doc-badge">Cuentas Bancarias</div>
      <div class="doc-num" style="font-size:12px">Documento Oficial</div>
      <div class="doc-date">${d.empresa_telefono}</div>
      ${d.empresa_nit ? `<div class="doc-date">NIT: ${d.empresa_nit}</div>` : ''}
    </div>
  </div>
  <div class="body">
    <div class="sec-title" style="margin-bottom:16px">Cuentas autorizadas para depositos y transferencias</div>
    <div class="bank-grid">
      ${bancos.map(b => `
      <div class="bank-card">
        <div class="bank-header">
          <div class="bank-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="bank-name">${b.nombre}</div>
        </div>
        <div class="bank-body">
          <div class="bank-row">
            <span class="bank-label">Numero de cuenta</span>
            <span class="bank-value">${b.cuenta}</span>
          </div>
          <div class="bank-row">
            <span class="bank-label">A nombre de</span>
            <span class="bank-value" style="font-size:12px">${b.titular}</span>
          </div>
        </div>
      </div>`).join('')}
    </div>
    <div class="warning-box">
      <div class="warning-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <div class="warning-text">
        <strong>Importante — Lea antes de realizar su pago</strong>
        ${d.cuentas_nota}
      </div>
    </div>
    <div class="signs">
      <div class="sign-line"><strong>Representante Legal</strong>&nbsp;</div>
      <div class="sign-line"><strong>Sello de la Empresa</strong>&nbsp;</div>
    </div>
  </div>
  <div class="footer">
    <div class="footer-txt">
      <div class="footer-brand">Web<em>Soft</em> Solutions</div>
      ${d.empresa_direccion} · ${d.empresa_telefono}
    </div>
    <div class="footer-txt" style="text-align:right">
      Generado el ${new Date().toLocaleDateString('es-GT',{day:'2-digit',month:'long',year:'numeric'})}<br/>
      Verificar autenticidad: ${d.empresa_telefono}
    </div>
  </div>
</div>
<script>window.onload=function(){document.title='Cuentas Bancarias — ${d.empresa_nombre}'}</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
