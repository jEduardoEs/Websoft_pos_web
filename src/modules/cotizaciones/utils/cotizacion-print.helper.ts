import { calculateIVA } from '@/shared/money';

export function printCotizacionHTML(cot: any) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;

  const totalNum = Number(cot.total) || 0;
  const descuentoNum = Number(cot.descuento) || 0;
  const subtotalBruto = Number(cot.subtotal) || (totalNum + descuentoNum);
  const ivaAmt = calculateIVA(totalNum, 0.05);

  const itemsArr: any[] = Array.isArray(cot.items) ? cot.items : [];

  const rows = itemsArr.map((it: any) => `
    <tr>
      <td class="code">${it.codigo || ''}</td>
      <td>${it.descripcion}</td>
      <td class="center">${it.cantidad}</td>
      <td class="right">Q ${Number(it.precioUnitario).toFixed(2)}</td>
      <td class="right">Q ${Number(it.subtotal).toFixed(2)}</td>
      <td class="right">${it.descuento > 0 ? `Q ${Number(it.descuento).toFixed(2)}` : 'Q 0.00'}</td>
      <td class="right bold">Q ${Number(it.totalItem).toFixed(2)}</td>
    </tr>`).join('');

  w.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;font-size:11px;color:#0f172a;padding:24px 28px;background:#fff}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}
  .logo-wrap{display:flex;align-items:center;gap:12px}
  .logo-img{width:56px;height:56px;border-radius:10px;object-fit:contain}
  .brand-name{font-size:20px;font-weight:700;color:#0f172a;line-height:1}
  .brand-name span{color:#2563eb}
  .brand-sub{font-size:8px;letter-spacing:2px;color:#64748b;font-weight:600;margin-top:2px;text-transform:uppercase}
  .co-info{text-align:right;font-size:10px;color:#475569;line-height:1.7}
  .co-info strong{font-size:14px;font-weight:700;color:#0f172a;display:block;margin-bottom:2px}
  .banner{background:#2563eb;color:#fff;text-align:center;padding:9px;font-size:16px;font-weight:700;letter-spacing:5px;border-radius:6px;margin-bottom:14px}
  hr.blue{border:none;border-top:2px solid #2563eb;margin:10px 0}
  hr.light{border:none;border-top:1px solid #e2e8f0;margin:8px 0}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;font-size:10px}
  .row{display:flex;gap:6px;margin-bottom:3px}
  .lbl{font-weight:700;color:#374151;min-width:75px;flex-shrink:0}
  .val{color:#475569}
  .fp{font-size:10px;margin-bottom:10px}.fp strong{color:#2563eb}
  table{width:100%;border-collapse:collapse;margin-bottom:12px}
  thead tr{background:#eff6ff}
  thead th{padding:7px 9px;font-size:10px;font-weight:700;text-align:left;color:#1e40af;border-bottom:2px solid #bfdbfe}
  tbody tr:nth-child(even){background:#f8fafc}
  tbody td{padding:6px 9px;border-bottom:1px solid #f1f5f9;font-size:10px}
  .code{font-family:monospace;font-size:9px;color:#2563eb;font-weight:700}
  .center{text-align:center}.right{text-align:right}.bold{font-weight:700}
  .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:12px}
  .totals{background:#f8fafc;border:1.5px solid #bfdbfe;border-radius:8px;padding:11px 16px;min-width:230px}
  .t-row{display:flex;justify-content:space-between;font-size:11px;padding:3px 0;color:#475569}
  .t-iva{display:flex;justify-content:space-between;font-size:11px;padding:3px 0;color:#d97706;font-weight:600}
  .t-final{font-size:15px;font-weight:800;color:#2563eb;border-top:2px solid #bfdbfe;padding-top:7px;margin-top:5px;display:flex;justify-content:space-between}
  .notice{font-size:9px;font-weight:700;color:#dc2626;margin-bottom:7px;line-height:1.6}
  .conds{font-size:8.5px;color:#64748b;line-height:1.6;margin-bottom:10px}
  .conds strong{color:#374151}
  .highlight-block{font-size:10px;font-weight:700;color:#0f172a;background:#f0f9ff;border-left:3px solid #2563eb;padding:7px 12px;margin-bottom:7px;border-radius:0 6px 6px 0;line-height:1.6}
  .highlight-block strong{color:#1e40af;font-size:11px}
  .signs{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:20px}
  .sign-line{border-top:1.5px solid #0f172a;padding-top:4px;font-size:10px;font-weight:700}
  .footer{margin-top:16px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
  @media print{body{padding:12px}@page{margin:8mm;size:A4}}
</style>
</head><body>
<div class="header">
  <div class="logo-wrap">
    <img class="logo-img" src="https://websoftsolutions.com.gt/logo.png" alt="Logo WebSoft" onerror="this.onerror=null;this.src='/logo.png';" />
    <div>
      <div class="brand-name">Web<span>Soft</span> Solutions</div>
      <div class="brand-sub">Guastatoya · El Progreso · Guatemala</div>
    </div>
  </div>
  <div class="co-info">
    <strong>WEBSOFT SOLUTIONS</strong>
    Barrio el Calvario, Guastatoya, El Progreso<br>
    TEL: (502) 3836-1044 / 3671-4377<br>
    www.websoftsolutions.com.gt
  </div>
</div>

<div class="banner">C O T I Z A C I O N</div>
<hr class="blue">

<div class="grid2">
  <div>
    <div class="row"><span class="lbl">Nombre:</span><span class="val">${cot.clienteNombre}</span></div>
    <div class="row"><span class="lbl">Direccion:</span><span class="val">${cot.clienteDireccion || ''}</span></div>
    <div class="row"><span class="lbl">Telefono:</span><span class="val">${cot.clienteTelefono || ''}</span></div>
    <div class="row"><span class="lbl">NIT:</span><span class="val">${cot.clienteNit || 'CF'}</span></div>
  </div>
  <div>
    <div class="row"><span class="lbl">Atencion a:</span><span class="val">${cot.atencion || ''}</span></div>
    <div class="row"><span class="lbl">Fecha:</span><span class="val">${new Date(cot.fecha).toLocaleDateString('es-GT')}</span></div>
    <div class="row"><span class="lbl">No. Cotizacion:</span><span class="val"><b>${cot.numero}</b></span></div>
    <div class="row"><span class="lbl">Validez:</span><span class="val">${cot.validezDias} dias</span></div>
  </div>
</div>
<hr class="blue">

<div class="fp"><strong>Forma de Pago:</strong> ${cot.formaPago || ''}</div>
${cot.descripcion ? `<div style="font-weight:700;font-size:11px;margin-bottom:8px;color:#1e40af">${cot.descripcion}</div>` : ''}

<table>
  <thead><tr>
    <th style="width:72px">Codigo</th>
    <th>Descripcion</th>
    <th style="width:48px;text-align:center">Cant.</th>
    <th style="width:78px;text-align:right">P/Unit.</th>
    <th style="width:78px;text-align:right">Subtotal</th>
    <th style="width:72px;text-align:right">Descuento</th>
    <th style="width:82px;text-align:right">Total</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>

<div class="totals-wrap">
  <div class="totals">
    <div class="t-row"><span>Subtotal</span><span>Q ${subtotalBruto.toFixed(2)}</span></div>
    ${descuentoNum > 0 ? `<div class="t-row" style="color:#dc2626"><span>Descuento</span><span>-Q ${descuentoNum.toFixed(2)}</span></div>` : ''}
    <div class="t-iva"><span>IVA Incluido (5%)</span><span>Q ${ivaAmt.toFixed(2)}</span></div>
    <div class="t-final"><span>TOTAL A PAGAR</span><span>Q ${totalNum.toFixed(2)}</span></div>
  </div>
</div>

<div class="notice">SUJETO A DISPONIBILIDAD. CONSULTAR EXISTENCIAS ANTES DE GENERAR PAGO.</div>
<div class="conds">
  <strong>CONDICIONES:</strong>
  1. <strong>PAGO:</strong> Anticipado, contra entrega, financiado o tarjeta. Cheques a nombre de WebSoft Solutions.
  2. <strong>ENTREGA:</strong> Inmediata a 3 dias segun pago. Sin existencia puede variar hasta 3 semanas.
  3. <strong>GARANTIA:</strong> Se atiende en instalaciones de WebSoft. Danos fisicos anulan garantia.
  4. <strong>SERVICIO:</strong> Departamento tecnico calificado para soporte durante garantia.
  </div>
${cot.tiempoInstalacion ? `<div class="highlight-block"><strong>TIEMPO DE INSTALACION:</strong> ${cot.tiempoInstalacion}</div>` : ''}
${cot.notas ? `<div class="highlight-block"><strong>NOTAS ADICIONALES:</strong> ${cot.notas}</div>` : ''}

<div class="signs">
  <div>
    <div class="sign-line">Aceptado (Cliente): _________________________</div>
    <div style="font-size:9px;color:#94a3b8;margin-top:4px">Fecha: _____ / _____ / ______</div>
  </div>
  <div style="text-align:right;font-size:9px;color:#94a3b8">${cot.numero} · Valida ${cot.validezDias} dias</div>
</div>

<div class="footer">
  <span>WebSoft Solutions · Guastatoya, El Progreso</span>
  <span>Documento de Cotización Comercial</span>
</div>
</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 250);
}
