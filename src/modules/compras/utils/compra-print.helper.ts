import { Compra } from '../types/compra';

export function printCompraHTML(compra: Compra) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;

  const totalNum = Number(compra.total) || 0;
  const proveedorNombre = compra.proveedor?.nombre || compra.proveedorNombre || 'Proveedor no especificado';
  const proveedorNit = compra.proveedor?.nit || compra.proveedorNit || 'CF';
  const facturaStr = compra.numeroFactura 
    ? `${compra.serieFactura ? compra.serieFactura + ' - ' : ''}${compra.numeroFactura}`
    : 'Sin Documento Físico / Interno';

  const rows = (compra.items || []).map((it, idx) => `
    <tr>
      <td class="center">${idx + 1}</td>
      <td class="bold">${it.nombre || 'Producto'}</td>
      <td class="center bold">${it.cantidad}</td>
      <td class="right">Q ${Number(it.precioUnitario).toFixed(2)}</td>
      <td class="right bold">Q ${Number(it.subtotal).toFixed(2)}</td>
    </tr>`).join('');

  w.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Resumen de Compra ${compra.numero}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;font-size:11px;color:#0f172a;padding:24px 28px;background:#fff}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}
  .logo-wrap{display:flex;align-items:center;gap:12px}
  .logo-img{height:52px;object-fit:contain;border-radius:8px}
  .brand-name{font-size:20px;font-weight:800;color:#0f172a;line-height:1;letter-spacing:-0.5px}
  .brand-name span{color:#2563eb}
  .brand-sub{font-size:8px;letter-spacing:2px;color:#64748b;font-weight:600;margin-top:3px;text-transform:uppercase}
  .co-info{text-align:right;font-size:10px;color:#475569;line-height:1.7}
  .co-info strong{font-size:14px;font-weight:700;color:#0f172a;display:block;margin-bottom:2px}
  .banner{background:#0f172a;color:#fff;text-align:center;padding:9px;font-size:15px;font-weight:700;letter-spacing:4px;border-radius:6px;margin-bottom:14px;text-transform:uppercase}
  hr.dark{border:none;border-top:2px solid #0f172a;margin:10px 0}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;font-size:10px}
  .row{display:flex;gap:6px;margin-bottom:4px}
  .lbl{font-weight:700;color:#374151;min-width:90px;flex-shrink:0}
  .val{color:#475569;font-weight:500}
  table{width:100%;border-collapse:collapse;margin-bottom:14px}
  thead tr{background:#f1f5f9}
  thead th{padding:8px 10px;font-size:10px;font-weight:700;text-align:left;color:#334155;border-bottom:2px solid #cbd5e1;text-transform:uppercase}
  tbody tr:nth-child(even){background:#f8fafc}
  tbody td{padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:10.5px}
  .center{text-align:center}.right{text-align:right}.bold{font-weight:700}
  .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:14px}
  .totals{background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:8px;padding:12px 18px;min-width:260px}
  .t-final{font-size:15px;font-weight:800;color:#0f172a;display:flex;justify-content:space-between;align-items:center}
  .highlight-block{font-size:10px;font-weight:600;color:#0f172a;background:#f8fafc;border-left:3px solid #64748b;padding:8px 12px;margin-bottom:12px;border-radius:0 6px 6px 0;line-height:1.5}
  .highlight-block strong{color:#334155;font-size:10.5px;display:block;margin-bottom:2px}
  .signs{display:flex;justify-content:flex-start;margin-top:35px}
  .sign-line{border-top:1.5px solid #0f172a;padding-top:5px;font-size:10px;font-weight:700;color:#0f172a}
  .footer{margin-top:20px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
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

<div class="banner">RESUMEN DE COMPRA</div>
<hr class="dark">

<div class="grid2">
  <div>
    <div class="row"><span class="lbl">No. Compra:</span><span class="val"><b>${compra.numero}</b></span></div>
    <div class="row"><span class="lbl">Proveedor:</span><span class="val"><b>${proveedorNombre}</b></span></div>
    <div class="row"><span class="lbl">NIT Proveedor:</span><span class="val">${proveedorNit}</span></div>
    <div class="row"><span class="lbl">Documento Factura:</span><span class="val">${facturaStr}</span></div>
  </div>
  <div>
    <div class="row"><span class="lbl">Fecha de Registro:</span><span class="val">${new Date(compra.fecha).toLocaleDateString('es-GT')}</span></div>
    <div class="row"><span class="lbl">Registrado por:</span><span class="val">${compra.usuarioNombre || 'Administrador'}</span></div>
    <div class="row"><span class="lbl">Estado de Ingreso:</span><span class="val" style="color:#16a34a;font-weight:700">${(compra.estado || 'COMPLETADO').toUpperCase()}</span></div>
    <div class="row"><span class="lbl">Total Productos:</span><span class="val">${compra.items?.length || 0} ítems</span></div>
  </div>
</div>
<hr class="dark">

<table>
  <thead><tr>
    <th style="width:36px;text-align:center">#</th>
    <th>Descripción del Producto</th>
    <th style="width:70px;text-align:center">Cantidad</th>
    <th style="width:100px;text-align:right">Costo Unit.</th>
    <th style="width:110px;text-align:right">Total Línea</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>

<div class="totals-wrap">
  <div class="totals">
    <div class="t-final"><span>TOTAL DE LA COMPRA</span><span>Q ${totalNum.toFixed(2)}</span></div>
  </div>
</div>

${compra.notas ? `<div class="highlight-block"><strong>NOTAS ADICIONALES DE COMPRA:</strong>${compra.notas}</div>` : ''}

<div class="signs">
  <div style="min-width:280px">
    <div class="sign-line">Ingresado por (Bodega / Inventario):</div>
    <div style="font-size:9px;color:#64748b;margin-top:3px">${compra.usuarioNombre || 'Usuario del Sistema'}</div>
  </div>
</div>

<div class="footer">
  <span>WebSoft Solutions · Resumen Comercial de Compra</span>
  <span>${compra.numero} · Impreso el ${new Date().toLocaleDateString('es-GT')}</span>
</div>
</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 250);
}
