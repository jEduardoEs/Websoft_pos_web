import { NextRequest, NextResponse } from 'next/server';
import { CotizacionService } from '@/modules/cotizaciones/services/cotizacion.service';
import { ConfigBackendService } from '@/modules/configuracion/services/config.backend.service';

export const dynamic = 'force-dynamic';

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 800): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cot = await fetchWithRetry(() => CotizacionService.findById(Number(params.id)));
    if (!cot) {
      return new NextResponse('Cotización no encontrada', { status: 404 });
    }

    const { d: configData } = await fetchWithRetry(() => ConfigBackendService.getCuentasPdfData()).catch(() => ({ d: {} as any }));

    const totalNum = Number(cot.total) || 0;
    const subtotalBase = totalNum / 1.05;
    const ivaMonto = totalNum - subtotalBase;
    const descuentoNum = Number(cot.descuento) || 0;

    const rows = (cot.items || []).map((it: any) => `
      <tr>
        <td class="code">${it.codigo || ''}</td>
        <td>${it.descripcion}</td>
        <td class="center">${it.cantidad}</td>
        <td class="right">Q ${Number(it.precioUnitario).toFixed(2)}</td>
        <td class="right">Q ${Number(it.subtotal || (it.cantidad * it.precioUnitario)).toFixed(2)}</td>
        <td class="right">${Number(it.descuento) > 0 ? `Q ${Number(it.descuento).toFixed(2)}` : 'Q 0.00'}</td>
        <td class="right bold">Q ${Number(it.totalItem).toFixed(2)}</td>
      </tr>
    `).join('');

    const fechaFormateada = cot.createdAt
      ? new Date(cot.createdAt).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : new Date().toLocaleDateString('es-GT');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cotización ${cot.numero} — ${configData.empresa_nombre || 'WebSoft Solutions'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    @page { size: A4; margin: 8mm; }
    @media print {
      @page { margin: 8mm; size: A4; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 12px; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; font-size: 11px; color: #0f172a; padding: 24px 28px; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
    .logo-wrap { display: flex; align-items: center; gap: 12px; }
    .logo-img { width: 56px; height: 56px; border-radius: 10px; object-fit: contain; }
    .brand-name { font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1; }
    .brand-name span { color: #2563eb; }
    .brand-sub { font-size: 8px; letter-spacing: 2px; color: #64748b; font-weight: 600; margin-top: 2px; text-transform: uppercase; }
    .co-info { text-align: right; font-size: 10px; color: #475569; line-height: 1.7; }
    .co-info strong { font-size: 14px; font-weight: 700; color: #0f172a; display: block; margin-bottom: 2px; }
    .banner { background: #2563eb; color: #fff; text-align: center; padding: 9px; font-size: 16px; font-weight: 700; letter-spacing: 5px; border-radius: 6px; margin-bottom: 14px; }
    hr.blue { border: none; border-top: 2px solid #2563eb; margin: 10px 0; }
    hr.light { border: none; border-top: 1px solid #e2e8f0; margin: 8px 0; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; font-size: 10px; }
    .row { display: flex; gap: 6px; margin-bottom: 3px; }
    .lbl { font-weight: 700; color: #374151; min-width: 75px; flex-shrink: 0; }
    .val { color: #475569; }
    .fp { font-size: 10px; margin-bottom: 10px; }
    .fp strong { color: #2563eb; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    thead tr { background: #eff6ff; }
    thead th { padding: 7px 9px; font-size: 10px; font-weight: 700; text-align: left; color: #1e40af; border-bottom: 2px solid #bfdbfe; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 6px 9px; border-bottom: 1px solid #f1f5f9; font-size: 10px; }
    .code { font-family: monospace; font-size: 9px; color: #2563eb; font-weight: 700; }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: 700; }
    .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 12px; }
    .totals { background: #f8fafc; border: 1.5px solid #bfdbfe; border-radius: 8px; padding: 11px 16px; min-width: 250px; }
    .t-row { display: flex; justify-content: space-between; font-size: 11px; padding: 3px 0; color: #475569; }
    .t-iva { display: flex; justify-content: space-between; font-size: 11px; padding: 3px 0; color: #d97706; font-weight: 600; }
    .t-final { font-size: 15px; font-weight: 800; color: #2563eb; border-top: 2px solid #bfdbfe; padding-top: 7px; margin-top: 5px; display: flex; justify-content: space-between; }
    .notice { font-size: 9px; font-weight: 700; color: #dc2626; margin-bottom: 7px; line-height: 1.6; }
    .conds { font-size: 8.5px; color: #64748b; line-height: 1.6; margin-bottom: 10px; }
    .conds strong { color: #374151; }
    .highlight-block { font-size: 10px; font-weight: 700; color: #0f172a; background: #f0f9ff; border-left: 3px solid #2563eb; padding: 7px 12px; margin-bottom: 7px; border-radius: 0 6px 6px 0; line-height: 1.6; }
    .highlight-block strong { color: #1e40af; font-size: 11px; }
    .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px; }
    .sign-line { border-top: 1.5px solid #0f172a; padding-top: 4px; font-size: 10px; font-weight: 700; }
    .footer { margin-top: 16px; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-wrap">
      <img class="logo-img" src="https://websoftsolutions.com.gt/logo.png" alt="Logo" onerror="this.style.display='none'"/>
      <div>
        <div class="brand-name">${configData.empresa_nombre ? configData.empresa_nombre.replace('WebSoft', 'Web<span>Soft</span>') : 'Web<span>Soft</span> Solutions'}</div>
        <div class="brand-sub">${configData.empresa_direccion || 'Guastatoya · El Progreso · Guatemala'}</div>
      </div>
    </div>
    <div class="co-info">
      <strong>${configData.empresa_nombre || 'WEBSOFT SOLUTIONS'}</strong>
      ${configData.empresa_direccion || 'Barrio el Calvario, Guastatoya, El Progreso'}<br>
      TEL: ${configData.empresa_telefono || '(502) 3836-1044 / 3671-4377'}<br>
      ${configData.empresa_nit ? `NIT: ${configData.empresa_nit}` : 'www.websoftsolutions.com.gt'}
    </div>
  </div>

  <div class="banner">C O T I Z A C I O N</div>
  <hr class="blue">

  <div class="grid2">
    <div>
      <div class="row"><span class="lbl">Nombre:</span><span class="val">${cot.clienteNombre}</span></div>
      <div class="row"><span class="lbl">Dirección:</span><span class="val">${cot.clienteDireccion || '—'}</span></div>
      <div class="row"><span class="lbl">Teléfono:</span><span class="val">${cot.clienteTelefono || '—'}</span></div>
      <div class="row"><span class="lbl">NIT:</span><span class="val">${cot.clienteNit || 'CF'}</span></div>
    </div>
    <div>
      <div class="row"><span class="lbl">Fecha:</span><span class="val">${fechaFormateada}</span></div>
      <div class="row"><span class="lbl">No. Cotización:</span><span class="val"><b>${cot.numero}</b></span></div>
      <div class="row"><span class="lbl">Validez:</span><span class="val">${cot.validezDias || 15} días</span></div>
    </div>
  </div>
  <hr class="blue">

  <div class="fp"><strong>Forma de Pago:</strong> ${cot.formaPago || 'Efectivo, Transferencia, Depósito, Cheque Preautorizado'}</div>
  ${cot.descripcion ? `<div style="font-weight:700;font-size:11px;margin-bottom:8px;color:#1e40af">${cot.descripcion}</div>` : ''}

  <table>
    <thead>
      <tr>
        <th style="width:72px">Código</th>
        <th>Descripción</th>
        <th style="width:48px;text-align:center">Cant.</th>
        <th style="width:78px;text-align:right">P/Unit.</th>
        <th style="width:78px;text-align:right">Subtotal</th>
        <th style="width:72px;text-align:right">Descuento</th>
        <th style="width:82px;text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="totals-wrap">
    <div class="totals">
      <div class="t-row"><span>Base (sin IVA)</span><span>Q ${subtotalBase.toFixed(2)}</span></div>
      ${descuentoNum > 0 ? `<div class="t-row" style="color:#dc2626"><span>Descuento</span><span>-Q ${descuentoNum.toFixed(2)}</span></div>` : ''}
      <div class="t-iva"><span>IVA Incluido (5%)</span><span>Q ${ivaMonto.toFixed(2)}</span></div>
      <div class="t-final"><span>TOTAL A PAGAR</span><span>Q ${totalNum.toFixed(2)}</span></div>
    </div>
  </div>

  <div class="notice">SUJETO A DISPONIBILIDAD. CONSULTAR EXISTENCIAS ANTES DE GENERAR PAGO.</div>
  <div class="conds">
    <strong>CONDICIONES:</strong>
    1. <strong>PAGO:</strong> Anticipado, contra entrega, financiado o tarjeta. Cheques a nombre de WebSoft Solutions.
    2. <strong>ENTREGA:</strong> Inmediata a 3 días según pago. Sin existencia puede variar hasta 3 semanas.
    3. <strong>GARANTÍA:</strong> Se atiende en instalaciones de WebSoft. Daños físicos anulan garantía.
    4. <strong>SERVICIO:</strong> Departamento técnico calificado para soporte durante garantía.
  </div>
  ${cot.tiempoInstalacion ? `<div class="highlight-block"><strong>TIEMPO DE INSTALACIÓN:</strong> ${cot.tiempoInstalacion}</div>` : ''}
  ${cot.notas ? `<div class="highlight-block"><strong>NOTAS ADICIONALES:</strong> ${cot.notas.replace(/\n/g, '<br/>')}</div>` : ''}

  <div class="signs">
    <div>
      <div class="sign-line">Aceptado (Cliente): _________________________</div>
      <div style="font-size:9px;color:#94a3b8;margin-top:4px">Fecha: _____ / _____ / ______</div>
    </div>
    <div style="text-align:right;font-size:9px;color:#94a3b8">${cot.numero} · Válida ${cot.validezDias || 15} días</div>
  </div>

  <div class="footer">
    <span>WebSoft Solutions · Sistema POS</span>
    <span>Tel: 3836-1044 / 3671-4377 · Guastatoya, El Progreso</span>
  </div>

  <script>
    window.onload = function() {
      document.title = 'Cotización ${cot.numero} — ${cot.clienteNombre}';
      window.focus();
      setTimeout(function() {
        window.print();
      }, 300);
    }
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (e: any) {
    return new NextResponse(`Error al generar PDF: ${e.message || 'Error interno'}`, { status: 500 });
  }
}
