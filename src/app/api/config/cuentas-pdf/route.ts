import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Get all config values needed
    const keys = [
      'empresa_nombre', 'empresa_nit', 'empresa_telefono', 'empresa_web',
      'banco1_nombre', 'banco1_cuenta', 'banco1_titular',
      'banco2_nombre', 'banco2_cuenta', 'banco2_titular',
      'banco3_nombre', 'banco3_cuenta', 'banco3_titular',
      'banco4_nombre', 'banco4_cuenta', 'banco4_titular',
      'cuentas_nota',
    ]

    const rows = await prisma.config.findMany({ where: { clave: { in: keys } } })
    const cfg: Record<string, string> = {}
    rows.forEach(r => { cfg[r.clave] = r.valor })

    // Defaults
    const defaults: Record<string, string> = {
      empresa_nombre: 'WebSoft Solutions',
      empresa_nit: '',
      empresa_telefono: '3836-1044 / 3671-4377',
      empresa_web: 'websoft-solutions.vercel.app',
      banco1_nombre: 'BANRURAL',
      banco1_cuenta: '',
      banco1_titular: 'WebSoft Solutions',
      banco2_nombre: 'BANCO INDUSTRIAL (Bi)',
      banco2_cuenta: '',
      banco2_titular: 'WebSoft Solutions',
      banco3_nombre: 'G&T CONTINENTAL',
      banco3_cuenta: '',
      banco3_titular: 'WebSoft Solutions',
      banco4_nombre: 'BAC',
      banco4_cuenta: '',
      banco4_titular: 'WebSoft Solutions',
      cuentas_nota: 'Estas son las únicas cuentas bancarias donde puede realizar su depósito o transferencia. No se estarán procesando órdenes si su depósito es realizado a otra cuenta.',
    }

    const data = { ...defaults, ...cfg }

    // Generate HTML for PDF
    const bancos = [1,2,3,4].map(i => ({
      nombre: data[`banco${i}_nombre`],
      cuenta: data[`banco${i}_cuenta`],
      titular: data[`banco${i}_titular`],
    })).filter(b => b.cuenta && b.cuenta.trim())

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Montserrat',Arial,sans-serif;background:#fff;min-height:100vh;display:flex;flex-direction:column}
  .page{display:grid;grid-template-columns:38% 62%;min-height:100vh}
  .left{background:linear-gradient(170deg,#1a3a5c 0%,#0d1f35 100%);position:relative;overflow:hidden}
  .left-overlay{position:absolute;inset:0;background:linear-gradient(to right,rgba(13,31,53,.3),rgba(13,31,53,.8));display:flex;flex-direction:column;justify-content:flex-end;padding:32px}
  .left-text{color:rgba(255,255,255,.7);font-size:13px;line-height:1.6}
  .left-accent{width:4px;height:60px;background:#2B7FD4;border-radius:2px;margin-bottom:16px}
  .right{background:#fff;padding:48px 44px;display:flex;flex-direction:column}
  .logo-area{text-align:center;margin-bottom:36px;padding-bottom:28px;border-bottom:2px solid #f1f5f9}
  .logo-name{font-size:28px;font-weight:800;color:#0d1f35;letter-spacing:-0.5px}
  .logo-name span{color:#2B7FD4}
  .logo-sub{font-size:12px;color:#64748b;margin-top:4px;letter-spacing:1px;text-transform:uppercase}
  .title{font-size:16px;font-weight:600;color:#475569;text-align:center;margin-bottom:32px;letter-spacing:.5px}
  .banco{margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid #f1f5f9}
  .banco:last-of-type{border-bottom:none}
  .banco-nombre{font-size:15px;font-weight:800;color:#2B7FD4;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
  .banco-row{display:flex;align-items:baseline;gap:6px;margin-bottom:6px}
  .banco-lbl{font-size:13px;color:#64748b;min-width:130px}
  .banco-val{font-size:15px;font-weight:700;color:#0d1f35;letter-spacing:.5px}
  .nota{margin-top:auto;padding:16px 18px;background:#f8fafc;border-left:4px solid #2B7FD4;border-radius:0 8px 8px 0;font-size:11.5px;color:#475569;line-height:1.7}
  .nota strong{color:#0d1f35}
  .footer-bar{background:#0d1f35;padding:12px 44px;display:flex;justify-content:space-between;align-items:center}
  .footer-text{font-size:11px;color:rgba(255,255,255,.4)}
</style>
</head>
<body>
<div class="page">
  <div class="left">
    <div style="position:absolute;inset:0;background:url('data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%230d1f35\\'/></svg>');background-size:cover"></div>
    <div class="left-overlay">
      <div class="left-accent"></div>
      <div class="left-text">
        <strong style="color:#fff;font-size:15px;display:block;margin-bottom:8px">Pagos seguros</strong>
        Realice sus depósitos o transferencias únicamente a las cuentas indicadas en este documento.
      </div>
    </div>
  </div>
  <div class="right">
    <div class="logo-area">
      <div class="logo-name">Web<span>Soft</span> Solutions</div>
      <div class="logo-sub">Tecnología y Seguridad · Guastatoya</div>
    </div>
    <div class="title">Cuentas para depósitos y transferencias</div>
    ${bancos.map(b => `
    <div class="banco">
      <div class="banco-nombre">${b.nombre}:</div>
      <div class="banco-row"><span class="banco-lbl">Número de cuenta:</span><span class="banco-val">${b.cuenta}</span></div>
      <div class="banco-row"><span class="banco-lbl">Nombre:</span><span class="banco-val">${b.titular}</span></div>
    </div>`).join('')}
    <div class="nota">
      <strong>Importante:</strong> ${data.cuentas_nota}
    </div>
  </div>
</div>
<div class="footer-bar">
  <span class="footer-text">${data.empresa_nombre} · NIT: ${data.empresa_nit || 'CF'}</span>
  <span class="footer-text">${data.empresa_telefono}</span>
  <span class="footer-text">${data.empresa_web}</span>
</div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
