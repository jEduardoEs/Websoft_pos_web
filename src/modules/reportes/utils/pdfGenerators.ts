import { calculateIVA } from '@/shared/money';

function safeDate(val: any): string {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

export function exportarInventarioPDF(invReporte: any) {
  if (!invReporte) return;
  const { resumen = {}, porCategoria = [] } = invReporte;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;font-size:11px;color:#0f172a;padding:20px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;border-bottom:2px solid #2563eb;margin-bottom:16px}
    .logo{font-size:18px;font-weight:700}.logo span{color:#2563eb}
    .badge{font-size:9px;font-weight:700;background:#2563eb;color:#fff;padding:3px 10px;border-radius:20px}
    .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
    .kpi{border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;border-top:3px solid}
    .kpi-label{font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:4px}
    .kpi-value{font-size:16px;font-weight:700}
    table{width:100%;border-collapse:collapse;margin-bottom:14px}
    th{background:#f8fafc;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;padding:7px 10px;text-align:left;border-bottom:1px solid #e2e8f0}
    td{padding:7px 10px;font-size:11px;border-bottom:1px solid #f1f5f9}
    .right{text-align:right}.center{text-align:center}
    .total-row td{font-weight:700;background:#f8fafc;border-top:2px solid #e2e8f0}
    .footer{margin-top:16px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
    @media print{@page{margin:8mm;size:A4}}
  </style></head><body>
  <div class="header">
    <div><div class="logo">Web<span>Soft</span> Solutions</div><div style="font-size:9px;color:#64748b;margin-top:2px">Guastatoya, El Progreso</div></div>
    <div style="text-align:right"><div class="badge">VALORACION DE INVENTARIO</div><div style="font-size:9px;color:#64748b;margin-top:5px">Generado: ${safeDate(new Date())}</div></div>
  </div>
  <div class="kpis">
    <div class="kpi" style="border-top-color:#2563eb"><div class="kpi-label">Total productos</div><div class="kpi-value" style="color:#2563eb">${resumen.totalProductos || 0}</div></div>
    <div class="kpi" style="border-top-color:#d97706"><div class="kpi-label">Inversion total</div><div class="kpi-value" style="color:#d97706">Q ${Number(resumen.totalInversion || 0).toFixed(2)}</div></div>
    <div class="kpi" style="border-top-color:#16a34a"><div class="kpi-label">Valor de venta</div><div class="kpi-value" style="color:#16a34a">Q ${Number(resumen.totalValorVenta || 0).toFixed(2)}</div></div>
    <div class="kpi" style="border-top-color:#7c3aed"><div class="kpi-label">Ganancia proyectada</div><div class="kpi-value" style="color:#7c3aed">Q ${Number(resumen.gananciaProyectada || 0).toFixed(2)}</div></div>
  </div>
  <table>
    <thead><tr><th>Categoria</th><th class="center">Productos</th><th class="center">Unidades</th><th class="right">Inversion (costo)</th><th class="right">Valor venta</th><th class="right">Ganancia</th><th class="right">Margen</th></tr></thead>
    <tbody>
      ${porCategoria.map((cat: any) => {
        const inv = Number(cat.inversion || 0);
        const vv = Number(cat.valorVenta || 0);
        const gan = vv - inv;
        const mar = inv > 0 ? Math.round((gan / inv) * 100) : 0;
        return `<tr><td style="font-weight:600">${cat.categoria || 'Sin categoría'}</td><td class="center">${cat.items || 0}</td><td class="center">${cat.stock || 0}</td><td class="right">Q ${inv.toFixed(2)}</td><td class="right">Q ${vv.toFixed(2)}</td><td class="right" style="color:#7c3aed">Q ${gan.toFixed(2)}</td><td class="right" style="font-weight:700;color:${mar>=30?'#16a34a':mar>=15?'#d97706':'#dc2626'}">${mar}%</td></tr>`;
      }).join('')}
      <tr class="total-row"><td>TOTALES</td><td class="center">${resumen.totalProductos || 0}</td><td class="center">${resumen.totalUnidades || 0}</td><td class="right">Q ${Number(resumen.totalInversion || 0).toFixed(2)}</td><td class="right">Q ${Number(resumen.totalValorVenta || 0).toFixed(2)}</td><td class="right">Q ${Number(resumen.gananciaProyectada || 0).toFixed(2)}</td><td class="right">${resumen.margenProyectado || 0}%</td></tr>
    </tbody>
  </table>
  <div style="margin-top:10px;padding:10px;background:#fef3c7;border-radius:6px;font-size:10px;color:#92400e"><strong>Alertas:</strong> ${resumen.productosStockBajo || 0} productos con stock bajo · ${resumen.productosAgotados || 0} productos agotados</div>
  <div class="footer"><span>WebSoft Solutions · Guastatoya, El Progreso</span><span>Este reporte es confidencial</span></div>
  </body></html>`;
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  } else {
    alert('Por favor autoriza las ventanas emergentes (popups) para imprimir el PDF.');
  }
}

export function exportarPatrimonioPDF(d: any) {
  if (!d) return;
  const fmtQ = (n: number) => `Q ${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const hoy = safeDate(d.fechaReporte || new Date());

  const rowsActivos = d.activosFijos.map((a: any, i: number) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f8faff'}">
      <td class="code">${a.codigo}</td>
      <td>${a.nombre}</td>
      <td>${a.descripcion || '—'}</td>
      <td class="center">${safeDate(a.fechaAdquisicion)}</td>
      <td class="right">${fmtQ(a.costoOriginal)}</td>
      <td class="center">${a.vidaUtilAnios} años</td>
      <td class="right" style="color:#d97706">${fmtQ(a.depreciacionAcum)}</td>
      <td class="right bold blue">${fmtQ(a.valorNeto)}</td>
    </tr>
  `).join('')

  const rowsProductos = (d.inventarioProductos || []).map((p: any, i: number) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f8faff'}">
      <td class="code">${p.codigo}</td>
      <td>${p.nombre}</td>
      <td class="center">${p.categoria}</td>
      <td class="center">${p.stock}</td>
      <td class="right">${fmtQ(p.costo)}</td>
      <td class="right bold">${fmtQ(p.valorCostoTotal)}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Estado de Patrimonio y Valoración de Activos — ${d.empresa.nombre}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm 12mm 12mm 12mm; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #0f172a; background: #fff; padding: 14px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #003087; padding-bottom: 12px; margin-bottom: 14px; }
    .company { font-size: 18px; font-weight: 800; color: #003087; letter-spacing: -0.5px; }
    .company span { color: #2563eb; }
    .sub { font-size: 9px; color: #64748b; margin-top: 2px; }
    .badge { font-size: 9px; font-weight: 800; background: #003087; color: #fff; padding: 4px 12px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; }
    .cert-box { background: #f0f4ff; border: 1.5px solid #003087; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; font-size: 9.5px; color: #1e3a8a; line-height: 1.4; }
    .cert-title { font-weight: 800; text-transform: uppercase; font-size: 10px; color: #003087; margin-bottom: 3px; }
    .grid-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
    .card-sum { border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; background: #f8fafc; }
    .card-sum.main { border-color: #003087; background: #e6eaf4; }
    .card-lbl { font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .card-val { font-size: 16px; font-weight: 900; color: #0f172a; }
    .card-val.blue { color: #003087; }
    .sec-title { font-size: 11px; font-weight: 800; color: #003087; text-transform: uppercase; letter-spacing: 0.5px; margin: 14px 0 8px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9.5px; }
    th { background: #003087; color: #fff; font-size: 9px; font-weight: 700; text-transform: uppercase; padding: 6px 8px; text-align: left; }
    td { padding: 5.5px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
    .right { text-align: right; } .center { text-align: center; } .bold { font-weight: 700; } .blue { color: #003087; } .code { font-family: monospace; font-weight: 700; color: #2563eb; }
    .tr-total { background: #e6eaf4 !important; font-weight: 800; border-top: 2px solid #003087; }
    .tr-total td { font-size: 10px; padding: 7px 8px; color: #003087; }
    .nota { background: #fffbe6; border: 1px solid #ffe58f; border-radius: 6px; padding: 8px 12px; font-size: 8.5px; color: #78350f; margin-top: 14px; line-height: 1.4; }
    .signs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; text-align: center; }
    .sign-line { border-top: 1.5px solid #003087; padding-top: 4px; font-size: 9px; font-weight: 800; color: #003087; }
    .sign-sub { font-size: 8px; color: #64748b; margin-top: 2px; }
    .footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 8px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">${d.empresa.nombre}</div>
      <div class="sub">NIT: ${d.empresa.nit} · ${d.empresa.direccion}</div>
      <div class="sub">Teléfono: ${d.empresa.telefono} · Web: ${d.empresa.web}</div>
    </div>
    <div style="text-align: right">
      <div class="badge">ESTADO DE PATRIMONIO OFICIAL</div>
      <div class="sub" style="margin-top: 4px; font-weight: 700">Fecha de Corte: ${hoy}</div>
    </div>
  </div>

  <div class="cert-box">
    <div class="cert-title"> CERTIFICACIÓN DE PATRIMONIO DE LA EMPRESA</div>
    El presente documento certifica el valor total del patrimonio activo de <strong>${d.empresa.nombre}</strong> (NIT ${d.empresa.nit}) a la fecha de corte <strong>${hoy}</strong>. El total consolidado incluye los activos fijos tangibles a valor neto contable y el inventario de mercancía valorado al costo de adquisición.
  </div>

  <div class="grid-summary">
    <div class="card-sum">
      <div class="card-lbl">Activos Fijos Netos</div>
      <div class="card-val">${fmtQ(d.resumenActivos.valorNeto)}</div>
      <div style="font-size:8px;color:#64748b;margin-top:2px">${d.resumenActivos.totalActivos} activos fijos registrados</div>
    </div>
    <div class="card-sum">
      <div class="card-lbl">Inventario al Costo</div>
      <div class="card-val">${fmtQ(d.resumenInventario.valorCosto)}</div>
      <div style="font-size:8px;color:#64748b;margin-top:2px">${d.resumenInventario.totalProductos} productos / ${d.resumenInventario.totalUnidades} uds</div>
    </div>
    <div class="card-sum main">
      <div class="card-lbl" style="color:#003087">PATRIMONIO TOTAL CONSOLIDADO</div>
      <div class="card-val blue" style="font-size:18px">${fmtQ(d.patrimonioTotal)}</div>
      <div style="font-size:8px;color:#003087;font-weight:700;margin-top:2px">Base para evaluación bancaria/crediticia</div>
    </div>
  </div>

  <div class="sec-title">1. Detalle de Activos Fijos Tangibles</div>
  <table>
    <thead>
      <tr>
        <th style="width:70px">Código</th>
        <th>Nombre del Activo</th>
        <th>Descripción / Especificaciones</th>
        <th style="width:75px;text-align:center">Fecha Adq.</th>
        <th style="width:80px;text-align:right">Costo Orig.</th>
        <th style="width:60px;text-align:center">Vida Útil</th>
        <th style="width:80px;text-align:right">Dep. Acum.</th>
        <th style="width:85px;text-align:right">Valor Neto</th>
      </tr>
    </thead>
    <tbody>
      ${rowsActivos}
      <tr class="tr-total">
        <td colspan="4">TOTAL ACTIVOS FIJOS (${d.resumenActivos.totalActivos} ítems)</td>
        <td class="right">${fmtQ(d.resumenActivos.costoOriginal)}</td>
        <td></td>
        <td class="right" style="color:#d97706">${fmtQ(d.resumenActivos.depreciacionAcum)}</td>
        <td class="right blue">${fmtQ(d.resumenActivos.valorNeto)}</td>
      </tr>
    </tbody>
  </table>

  <div class="sec-title">2. Resumen de Inventario de Mercancía</div>
  <table>
    <thead>
      <tr>
        <th style="width:80px">Código</th>
        <th>Producto</th>
        <th style="width:100px;text-align:center">Categoría</th>
        <th style="width:55px;text-align:center">Stock</th>
        <th style="width:88px;text-align:right">Costo unit.</th>
        <th style="width:88px;text-align:right">Valor total</th>
      </tr>
    </thead>
    <tbody>
      ${rowsProductos}
      <tr class="tr-total">
        <td colspan="5">TOTAL INVENTARIO (valor de costo)</td>
        <td class="right blue">${fmtQ(d.resumenInventario.valorCosto)}</td>
      </tr>
    </tbody>
  </table>

  <div class="nota">
    <strong>Nota metodológica:</strong> Los activos fijos se presentan a valor neto (costo de adquisición menos depreciación acumulada por línea recta). El inventario se valora al costo promedio de adquisición. Reporte generado automáticamente al ${hoy}. Para efectos bancarios debe ser certificado por contador público y auditor autorizado.
  </div>

  <div class="signs">
    <div><div style="height:32px"></div><div class="sign-line">REPRESENTANTE LEGAL</div><div class="sign-sub">Nombre y firma</div></div>
    <div><div style="height:32px"></div><div class="sign-line">CONTADOR / AUDITOR</div><div class="sign-sub">Colegiado No. ___________</div></div>
    <div><div style="height:32px"></div><div class="sign-line">SELLO DE LA EMPRESA</div><div class="sign-sub">&nbsp;</div></div>
  </div>

  <div class="footer">
    <span>WebSoft Solutions · ${d.empresa.web} · NIT: ${d.empresa.nit}</span>
    <span>Sistema POS WebSoft v0.07 · ${hoy}</span>
  </div>
</body>
</html>`

  const w = window.open('', '_blank', 'width=1000,height=700')
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  } else {
    alert('Por favor autoriza las ventanas emergentes (popups) para imprimir el PDF.');
  }
}

export function exportarPDFVentas(reporte: any, fi: string, ff: string) {
  if (!reporte) return;
  const granTotal = Number(reporte.granTotal || 0);
  const totalVentas = Number(reporte.totalVentas || 0);
  const ivaPct = 5;
  const ivaRecaudado = calculateIVA(granTotal, 0.05);

  const diasRows = Object.entries(reporte.porDia || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dia, v]: any) => {
      const tot = Number(v.total || 0);
      const cant = Number(v.ventas || 0);
      const prom = cant > 0 ? (tot / cant) : 0;
      return `<tr><td>${safeDate(dia)}</td><td class="center">${cant}</td><td class="right">Q ${tot.toFixed(2)}</td><td class="right">Q ${prom.toFixed(2)}</td><td class="center">0</td></tr>`;
    }).join('');

  const prodRows = (reporte.topProductos || []).slice(0, 15).map((p: any) => {
    const totP = Number(p.total || 0);
    const pct = granTotal > 0 ? Math.round((totP / granTotal) * 100) : 0;
    return `<tr><td>${p.nombre || '—'}</td><td class="center">${p.cantidad || 0}</td><td class="right">Q ${totP.toFixed(2)}</td><td class="center">${pct}%</td></tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#0f172a;padding:20px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #2563eb}
    .logo{font-size:20px;font-weight:800;color:#0f172a}.logo span{color:#2563eb}
    .badge{font-size:9px;font-weight:700;background:#2563eb;color:#fff;padding:3px 10px;border-radius:20px;letter-spacing:1px}
    .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
    .kpi{border:1px solid #e2e8f0;border-radius:8px;padding:12px;border-top:3px solid}
    .kpi-label{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
    .kpi-value{font-size:18px;font-weight:800}.kpi-sub{font-size:9px;color:#94a3b8;margin-top:3px}
    table{width:100%;border-collapse:collapse;margin-bottom:14px}
    th{background:#f8fafc;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;padding:7px 10px;text-align:left;border-bottom:1px solid #e2e8f0}
    td{padding:7px 10px;font-size:11px;border-bottom:1px solid #f1f5f9}.center{text-align:center}.right{text-align:right}
    .section-title{font-size:13px;font-weight:700;color:#0f172a;margin:18px 0 10px;border-left:3px solid #2563eb;padding-left:10px}
    .footer{margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
    @media print{body{padding:14px}@page{margin:8mm;size:A4}}
  </style></head><body>
  <div class="header">
    <div><div class="logo">Web<span>Soft</span> Solutions</div><div style="font-size:9px;color:#64748b;margin-top:3px">Guastatoya, El Progreso</div></div>
    <div style="text-align:right"><div class="badge">REPORTE DE VENTAS</div><div style="font-size:9px;color:#64748b;margin-top:6px">Periodo: ${safeDate(fi)} – ${safeDate(ff)}</div></div>
  </div>
  <div class="kpis">
    <div class="kpi" style="border-top-color:#2563eb"><div class="kpi-label">Total ventas</div><div class="kpi-value" style="color:#2563eb">${totalVentas}</div></div>
    <div class="kpi" style="border-top-color:#16a34a"><div class="kpi-label">Ingresos</div><div class="kpi-value" style="color:#16a34a">Q ${granTotal.toFixed(2)}</div></div>
    <div class="kpi" style="border-top-color:#d97706"><div class="kpi-label">IVA recaudado</div><div class="kpi-value" style="color:#d97706">Q ${ivaRecaudado.toFixed(2)}</div></div>
    <div class="kpi" style="border-top-color:#7c3aed"><div class="kpi-label">Ticket prom.</div><div class="kpi-value" style="color:#7c3aed">Q ${totalVentas > 0 ? (granTotal / totalVentas).toFixed(2) : '0.00'}</div></div>
  </div>
  <div class="section-title">Ventas por dia</div>
  <table><thead><tr><th>Fecha</th><th class="center">Ventas</th><th class="right">Total</th><th class="right">Ticket prom.</th><th class="center">Dev.</th></tr></thead><tbody>${diasRows}</tbody></table>
  <div class="section-title">Productos mas vendidos</div>
  <table><thead><tr><th>Producto</th><th class="center">Cantidad</th><th class="right">Total</th><th class="center">% ingresos</th></tr></thead><tbody>${prodRows}</tbody></table>
  <div class="footer"><span>WebSoft Solutions · Guastatoya, El Progreso</span><span>Generado el ${safeDate(new Date())}</span></div>
  </body></html>`
  const w = window.open('', '_blank')
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  } else {
    alert('Por favor autoriza las ventanas emergentes (popups) para imprimir el PDF.');
  }
}
